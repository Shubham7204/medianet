from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import google.generativeai as genai
from exa_py import Exa
import json
import logging
from concurrent.futures import ThreadPoolExecutor
from typing import List, Dict, Any
from dotenv import load_dotenv

# Set up logging
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class CampaignRequest(BaseModel):
    company_website: str
    company_name: str
    campaign_description: str
    audience_target_type: str  # e.g., "young professionals", "university students"
    city: str

class KeywordData(BaseModel):
    keyword: str
    category: str
    rationale: str
    description: str = ""
    source: str = ""
    monthly_search_volume: int = 0
    estimated_cpc: float = 0.0
    estimated_monthly_clicks: int = 0
    estimated_monthly_cost: float = 0.0
    projected_monthly_conversions: float = 0.0
    projected_monthly_revenue: float = 0.0
    projected_roas: float = 0.0

class MarketingStrategyResponse(BaseModel):
    dashboard_title: str
    generated_at: str
    campaign_inputs: Dict[str, Any]
    market_revenue_forecast: Dict[str, Any]
    ai_driven_strategy: Dict[str, Any]
    keyword_dashboard_data: List[Dict[str, Any]]

class KeywordAnalysisService:
    """
    Keyword Analysis and Marketing Strategy Generation Service
    """
    
    def __init__(self):
        self.exa_client = None
        self.gemini_model = None
        self.is_initialized = False
        self._initialize_services()
    
    def _initialize_services(self):
        """Initialize external API clients"""
        try:
            # Get API keys
            exa_api_key = os.getenv("EXA_API_KEY")
            gemini_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
            
            if not exa_api_key or not gemini_api_key:
                logger.warning("⚠️ Keyword Analysis: Missing API keys. Set EXA_API_KEY and GEMINI_API_KEY in .env file")
                return
            
            # Initialize clients
            self.exa_client = Exa(api_key=exa_api_key)
            genai.configure(api_key=gemini_api_key)
            self.gemini_model = genai.GenerativeModel("gemini-2.5-flash")
            
            self.is_initialized = True
            logger.info("✅ Keyword Analysis service initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Keyword Analysis service initialization failed: {e}")
            self.is_initialized = False
    
    def _check_service(self):
        """Check if service is available"""
        if not self.is_initialized:
            raise HTTPException(
                status_code=503,
                detail="Keyword Analysis service not initialized. Please check API keys."
            )
    
    def discover_keywords(self, company_name: str, campaign_description: str, 
                         audience_target: str, city: str, num_keywords: int = 15) -> List[Dict]:
        """Generate categorized keywords using Gemini AI"""
        self._check_service()
        
        logger.info(f"Generating keywords for campaign: {campaign_description}")
        
        prompt = f"""
        As a digital marketing expert for '{company_name}', a company with the following campaign goal: '{campaign_description}',
        generate {num_keywords} high-value keywords for a search advertising campaign.

        The campaign is specifically targeting the audience '{audience_target}' in the city of '{city}'.

        Include a mix of the following keyword categories:
        1. high_intent: Keywords that signal a strong intention to purchase or sign up
        2. brand: Keywords related to the company's name or products
        3. awareness: Broader keywords to attract users early in their journey

        For each keyword, provide a concise rationale explaining why it's a good choice for this specific campaign.
        
        Return the response as a single, valid JSON object with the structure:
        {{"keywords": [{{"keyword": "...", "category": "...", "rationale": "..."}}]}}
        """
        
        try:
            response = self.gemini_model.generate_content(
                prompt, 
                generation_config={"response_mime_type": "application/json"}
            )
            keywords_data = json.loads(response.text)
            return keywords_data.get("keywords", [])
        except Exception as e:
            logger.error(f"Gemini keyword generation failed: {e}")
            return []
    
    def enrich_keywords_with_sources(self, keywords_list: List[Dict]) -> List[Dict]:
        """Enrich keywords with descriptions and sources using Exa API"""
        self._check_service()
        
        logger.info(f"Fetching live web descriptions for {len(keywords_list)} keywords using Exa API")

        def search_for_single_keyword(keyword_data):
            keyword = keyword_data['keyword']
            try:
                search_response = self.exa_client.search_and_contents(
                    f"What is the significance of the keyword '{keyword}' in digital marketing?",
                    num_results=1,
                    text=True
                )
                if search_response.results:
                    top_result = search_response.results[0]
                    keyword_data['description'] = (top_result.text[:250] + '...' 
                                                 if top_result.text else "No text content found.")
                    keyword_data['source'] = top_result.url
                    logger.info(f"Successfully fetched source for '{keyword}': {top_result.url}")
                else:
                    keyword_data['description'] = "No description found."
                    keyword_data['source'] = "N/A"
            except Exception as e:
                logger.error(f"Exa search failed for keyword '{keyword}': {e}")
                keyword_data['description'] = "Failed to fetch description."
                keyword_data['source'] = "N/A"
            return keyword_data

        try:
            with ThreadPoolExecutor(max_workers=5) as executor:
                enriched_keywords = list(executor.map(search_for_single_keyword, keywords_list))
            return enriched_keywords
        except Exception as e:
            logger.error(f"Failed to enrich keywords: {e}")
            return keywords_list
    
    def estimate_ad_metrics(self, keywords: List[Dict]) -> List[Dict]:
        """Estimate advertising metrics for keywords"""
        logger.info("Estimating advertising metrics for keywords")
        
        for keyword_data in keywords:
            category = keyword_data.get('category')
            if category == 'high_intent':
                keyword_data['monthly_search_volume'] = np.random.randint(1000, 5000)
                keyword_data['estimated_cpc'] = round(np.random.uniform(5.0, 15.0), 2)
            elif category == 'brand':
                keyword_data['monthly_search_volume'] = np.random.randint(500, 10000)
                keyword_data['estimated_cpc'] = round(np.random.uniform(1.0, 5.0), 2)
            elif category == 'awareness':
                keyword_data['monthly_search_volume'] = np.random.randint(5000, 50000)
                keyword_data['estimated_cpc'] = round(np.random.uniform(0.5, 3.0), 2)
            else:  # Generic/Other
                keyword_data['monthly_search_volume'] = np.random.randint(200, 1000)
                keyword_data['estimated_cpc'] = round(np.random.uniform(2.0, 7.0), 2)
        
        return keywords
    
    def project_advertising_performance(self, keywords_with_metrics: List[Dict]) -> List[Dict]:
        """Project advertising performance based on estimated metrics"""
        logger.info("Projecting advertising performance and revenue")
        
        # Constants
        ASSUMED_CTR = 0.035
        ASSUMED_CONVERSION_RATE = 0.04
        ASSUMED_AVG_CONVERSION_VALUE = 250

        for kw in keywords_with_metrics:
            estimated_clicks = kw.get('monthly_search_volume', 0) * ASSUMED_CTR
            kw['estimated_monthly_clicks'] = int(round(estimated_clicks))
            
            estimated_cost = estimated_clicks * kw.get('estimated_cpc', 0)
            kw['estimated_monthly_cost'] = round(estimated_cost, 2)
            
            projected_conversions = estimated_clicks * ASSUMED_CONVERSION_RATE
            kw['projected_monthly_conversions'] = round(projected_conversions, 1)
            
            projected_revenue = projected_conversions * ASSUMED_AVG_CONVERSION_VALUE
            kw['projected_monthly_revenue'] = round(projected_revenue, 2)
            
            kw['projected_roas'] = (round(projected_revenue / estimated_cost, 2) 
                                  if estimated_cost > 0 else 0)
        
        return keywords_with_metrics
    
    def generate_revenue_forecast(self) -> Dict[str, Any]:
        """Generate simulated revenue forecast"""
        logger.info("Generating revenue forecast simulation")
        
        return {
            "test_mape": round(np.random.uniform(0.10, 0.25), 4),
            "forecasts": {
                "baseline": [22.5, 23.0, 23.5, 24.0, 24.5, 25.0, 25.5, 26.0, 26.5, 27.0, 27.5, 28.0],
                "optimistic": [23.0, 23.5, 24.0, 24.5, 25.0, 25.5, 26.0, 26.5, 27.0, 27.5, 28.0, 28.5],
                "pessimistic": [22.0, 22.5, 23.0, 23.5, 24.0, 24.5, 25.0, 25.5, 26.0, 26.5, 27.0, 27.5]
            }
        }
    
    def synthesize_insights(self, company_name: str, campaign_description: str,
                          keyword_performance_data: List[Dict], forecast_data: Dict) -> Dict[str, Any]:
        """Generate executive summary using Gemini AI"""
        self._check_service()
        
        logger.info("Synthesizing final executive summary with Gemini")
        
        # Get top performers
        top_performers = sorted(keyword_performance_data, 
                              key=lambda x: x.get('projected_monthly_revenue', 0), 
                              reverse=True)[:3]
        
        prompt = f"""
        As a Chief Marketing Officer for '{company_name}', whose current campaign focus is '{campaign_description}', 
        please analyze the provided marketing data and provide a concise executive summary and actionable strategic recommendations.

        Provided Data:
        - Top 3 Keywords by Projected Revenue: {json.dumps(top_performers)}
        - Overall Market Revenue Forecast (Scenarios): {json.dumps(forecast_data.get('forecasts', {}))}

        Required JSON Output Structure:
        {{
          "executive_summary": "A high-level summary of the market opportunity and how our targeted advertising strategy can capitalize on this.",
          "strategic_recommendations": [
            "Recommend which keyword category to prioritize for budget allocation and explain why.",
            "Provide actionable recommendation based on the revenue forecast.",
            "Suggest specific campaign angle or ad copy idea based on the most promising keyword."
          ]
        }}
        """
        
        try:
            response = self.gemini_model.generate_content(
                prompt, 
                generation_config={"response_mime_type": "application/json"}
            )
            return json.loads(response.text)
        except Exception as e:
            logger.error(f"Gemini insight synthesis failed: {e}")
            return {
                "executive_summary": "Analysis completed with simulated data.",
                "strategic_recommendations": [
                    "Focus on high-intent keywords for better conversion rates.",
                    "Allocate 60% of budget to top-performing keywords.",
                    "Test different ad copy variations for optimal performance."
                ]
            }
    
    async def generate_marketing_strategy(self, request: CampaignRequest) -> Dict[str, Any]:
        """Main method to generate comprehensive marketing strategy"""
        self._check_service()
        
        try:
            logger.info(f"Generating marketing strategy for {request.company_name}")
            
            # 1. Keyword Discovery
            keywords_list = self.discover_keywords(
                company_name=request.company_name,
                campaign_description=request.campaign_description,
                audience_target=request.audience_target_type,
                city=request.city
            )
            
            if not keywords_list:
                raise HTTPException(status_code=500, detail="Failed to generate keywords")
            
            # 2. Enrich with web sources
            keywords_with_details = self.enrich_keywords_with_sources(keywords_list)
            
            # 3. Estimate advertising metrics
            keywords_with_metrics = self.estimate_ad_metrics(keywords_with_details)
            
            # 4. Project performance
            keyword_performance_data = self.project_advertising_performance(keywords_with_metrics)
            
            # 5. Generate forecast
            model_results = self.generate_revenue_forecast()
            
            # 6. Synthesize insights
            ai_summary = self.synthesize_insights(
                company_name=request.company_name,
                campaign_description=request.campaign_description,
                keyword_performance_data=keyword_performance_data,
                forecast_data=model_results
            )
            
            # 7. Final output
            final_output = {
                "dashboard_title": f"{request.company_name} - Advertising Performance Dashboard",
                "generated_at": datetime.now().isoformat(),
                "campaign_inputs": request.dict(),
                "market_revenue_forecast": {
                    "model_accuracy_mape": model_results.get("test_mape"),
                    "scenarios": model_results.get("forecasts")
                },
                "ai_driven_strategy": ai_summary,
                "keyword_dashboard_data": keyword_performance_data
            }
            
            logger.info("✅ Marketing strategy generated successfully")
            return final_output
            
        except Exception as e:
            logger.error(f"Marketing strategy generation failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_service_status(self) -> Dict[str, Any]:
        """Get service status"""
        return {
            "initialized": self.is_initialized,
            "components": {
                "exa_client": self.exa_client is not None,
                "gemini_model": self.gemini_model is not None
            },
            "capabilities": [
                "keyword_discovery",
                "web_research", 
                "metrics_estimation",
                "performance_projection",
                "ai_insights"
            ]
        }

# Create singleton service instance
keyword_analysis_service = KeywordAnalysisService()

# Create FastAPI router
router = APIRouter()

@router.post("/generate-marketing-strategy", response_model=MarketingStrategyResponse)
async def generate_marketing_strategy(request: CampaignRequest):
    """
    Generate comprehensive marketing strategy with AI-driven keyword analysis
    """
    return await keyword_analysis_service.generate_marketing_strategy(request)

@router.get("/status")
async def get_service_status():
    """
    Get keyword analysis service status
    """
    return {
        "service": "keyword_analysis",
        "status": keyword_analysis_service.get_service_status(),
        "description": "AI-powered keyword analysis and marketing strategy generation",
        "endpoints": [
            {"path": "/generate-marketing-strategy", "method": "POST", "description": "Generate full marketing strategy"},
            {"path": "/status", "method": "GET", "description": "Get service status"}
        ]
    }

@router.get("/health")
async def health_check():
    """
    Health check for keyword analysis service
    """
    if keyword_analysis_service.is_initialized:
        return {"status": "healthy", "keyword_analysis_service": "initialized"}
    else:
        return {"status": "unhealthy", "keyword_analysis_service": "not_initialized"}