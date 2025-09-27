from fastapi import HTTPException
from pydantic import BaseModel
from exa_py import Exa
import google.generativeai as genai
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import logging

# Set up logging
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class QueryRequest(BaseModel):
    query: str
    num_results: int = 8

class ExaAgent:
    """Exa web search agent for MediaNet analytics"""
    
    def __init__(self):
        self.exa_client = None
        self.gemini_model = None
        self._initialize_services()
    
    def _initialize_services(self):
        """Initialize Exa and Gemini services."""
        # Initialize Exa
        exa_api_key = os.getenv("EXA_API_KEY")
        if exa_api_key:
            try:
                self.exa_client = Exa(api_key=exa_api_key)
                logger.info("✅ Exa API configured successfully")
            except Exception as e:
                logger.error(f"❌ Failed to configure Exa: {e}")
                self.exa_client = None
        else:
            logger.warning("⚠️ EXA_API_KEY not found in environment variables")
        
        # Initialize Gemini
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if api_key:
            try:
                genai.configure(api_key=api_key)
                self.gemini_model = genai.GenerativeModel("gemini-2.0-flash-exp")
                logger.info("✅ Gemini API configured for Exa agent")
            except Exception as e:
                logger.error(f"❌ Failed to configure Gemini for Exa agent: {e}")
                try:
                    # Fallback to flash model
                    self.gemini_model = genai.GenerativeModel("gemini-1.5-flash")
                    logger.info("✅ Gemini API configured with fallback model")
                except Exception as e2:
                    logger.error(f"❌ Failed to configure Gemini fallback: {e2}")
                    self.gemini_model = None

    def _check_services(self):
        """Check if required services are available."""
        if not self.exa_client:
            raise HTTPException(
                status_code=503, 
                detail="Exa API not configured. Please set EXA_API_KEY environment variable."
            )
        if not self.gemini_model:
            raise HTTPException(
                status_code=503, 
                detail="Gemini API not configured. Please set GEMINI_API_KEY environment variable."
            )

    async def advertiser_competitive_intelligence(self, req: QueryRequest):
        """Exa-powered competitive intelligence for advertisers."""
        self._check_services()
        
        try:
            logger.info(f"Running advertiser competitive intelligence for: {req.query}")
            
            # Search competitor ads and reviews
            competitor_results = self.exa_client.search_and_contents(
                f"best {req.query} reviews comparison advertising marketing campaigns",
                type="neural",
                num_results=req.num_results,
                text={"max_characters": 500}
            )

            # Search market trends
            trending_results = self.exa_client.search_and_contents(
                f"{req.query} market trends 2025 advertising strategy analysis",
                type="neural",
                num_results=5,
                text={"max_characters": 500}
            )

            # Analyze competitor domains
            competitor_domains = {}
            for result in competitor_results.results:
                try:
                    domain = result.url.split('/')[2].replace('www.', '')
                    competitor_domains[domain] = competitor_domains.get(domain, 0) + 1
                except (IndexError, AttributeError):
                    continue

            top_competitors = sorted(competitor_domains.items(), key=lambda x: x[1], reverse=True)[:5]

            # Generate AI insights with Gemini
            competitor_info = "\n".join([
                f"Title: {r.title}\nURL: {r.url}\nContent: {r.text[:200] if r.text else 'No content'}" 
                for r in competitor_results.results[:5]
            ])
            
            trending_info = "\n".join([
                f"Trend: {r.title}\nContent: {r.text[:150] if r.text else 'No content'}" 
                for r in trending_results.results[:3]
            ])

            gemini_prompt = f"""
            Based on this competitive analysis for '{req.query}':

            COMPETITOR ANALYSIS:
            {competitor_info}

            MARKET TRENDS:
            {trending_info}

            As an expert marketing strategist, provide actionable insights for advertisers in JSON format:
            {{
                "market_gaps": ["specific gap 1", "specific gap 2", "specific gap 3"],
                "bidding_strategy": "recommended approach with specific tactics",
                "key_differentiators": ["differentiator 1", "differentiator 2", "differentiator 3"],
                "target_audience": "detailed audience description with demographics",
                "campaign_angles": ["angle 1", "angle 2", "angle 3"],
                "competitive_advantage": "how to outperform competitors"
            }}
            """

            try:
                ai_response = self.gemini_model.generate_content(
                    gemini_prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=0.2,
                        max_output_tokens=2000,
                        response_mime_type="application/json"
                    )
                )
                ai_insights = ai_response.text
                logger.info("✅ AI insights generated successfully")
            except Exception as e:
                logger.error(f"AI insights generation failed: {e}")
                ai_insights = {
                    "error": "AI analysis temporarily unavailable",
                    "raw_data_available": True
                }

            return {
                "service": "advertiser",
                "query": req.query,
                "timestamp": datetime.now().isoformat(),
                "top_competitors": [{"domain": comp[0], "mentions": comp[1]} for comp in top_competitors],
                "competitor_analysis": [
                    {
                        "title": r.title, 
                        "url": r.url, 
                        "snippet": r.text[:200] if r.text else "No content available",
                        "published_date": getattr(r, 'published_date', None)
                    }
                    for r in competitor_results.results[:5]
                ],
                "market_trends": [
                    {
                        "title": r.title, 
                        "url": r.url, 
                        "snippet": r.text[:200] if r.text else "No content available"
                    }
                    for r in trending_results.results[:3]
                ],
                "ai_insights": ai_insights,
                "total_results": len(competitor_results.results)
            }

        except Exception as e:
            logger.error(f"Advertiser competitive intelligence failed: {e}")
            raise HTTPException(status_code=500, detail=f"Competitive intelligence analysis failed: {str(e)}")

    async def publisher_content_strategy(self, req: QueryRequest):
        """Exa-powered content strategy for publishers."""
        self._check_services()
        
        try:
            logger.info(f"Running publisher content strategy for: {req.query}")
            
            # Get recent trending content
            last_month = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")

            trending_content = self.exa_client.search_and_contents(
                f"trending {req.query} articles blog posts viral content this week",
                type="neural",
                num_results=req.num_results,
                start_published_date=last_month,
                text={"max_characters": 500}
            )

            # Search for SEO and content opportunities
            seo_content = self.exa_client.search_and_contents(
                f"{req.query} SEO content marketing strategy high traffic keywords",
                type="neural",
                num_results=5,
                text={"max_characters": 300}
            )

            # Extract trending keywords from titles
            all_titles = [r.title.lower() for r in trending_content.results if r.title]
            common_words = {}
            
            # Filter out common stop words
            stop_words = {'the', 'and', 'for', 'are', 'with', 'how', 'you', 'this', 'that', 'from', 'they', 'been', 'have', 'your', 'what', 'can', 'all', 'will', 'one', 'more', 'her', 'him', 'his', 'she'}
            
            for title in all_titles:
                words = [w.strip('.,!?()[]{}":;') for w in title.split() if len(w) > 3 and w.lower() not in stop_words]
                for word in words:
                    if word.isalpha():  # Only alphabetic words
                        common_words[word] = common_words.get(word, 0) + 1
            
            top_keywords = sorted(common_words.items(), key=lambda x: x[1], reverse=True)[:8]

            # Generate AI content strategy
            trending_titles = "\n".join([r.title for r in trending_content.results[:5] if r.title])
            trending_previews = "\n".join([r.text[:150] if r.text else "No preview available" for r in trending_content.results[:5]])
            seo_insights = "\n".join([f"{r.title}: {r.text[:100] if r.text else ''}" for r in seo_content.results[:3]])

            content_strategy_prompt = f"""
            Based on trending content analysis for '{req.query}':

            TRENDING TITLES:
            {trending_titles}

            CONTENT PREVIEWS:
            {trending_previews}

            SEO INSIGHTS:
            {seo_insights}

            TOP KEYWORDS: {', '.join([k[0] for k in top_keywords[:5]])}

            As an expert content strategist, provide a comprehensive strategy in JSON format:
            {{
                "article_ideas": ["specific article idea 1", "specific article idea 2", "specific article idea 3", "specific article idea 4", "specific article idea 5"],
                "content_formats": ["format 1 with reasoning", "format 2 with reasoning", "format 3 with reasoning"],
                "seo_keywords": ["high-value keyword 1", "high-value keyword 2", "high-value keyword 3", "high-value keyword 4"],
                "target_audience": "detailed audience persona with interests and behaviors",
                "content_calendar": ["week 1 focus", "week 2 focus", "week 3 focus", "week 4 focus"],
                "monetization_opportunities": ["opportunity 1", "opportunity 2", "opportunity 3"]
            }}
            """

            try:
                ai_response = self.gemini_model.generate_content(
                    content_strategy_prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=0.3,
                        max_output_tokens=2000,
                        response_mime_type="application/json"
                    )
                )
                ai_insights = ai_response.text
                logger.info("✅ Content strategy generated successfully")
            except Exception as e:
                logger.error(f"AI content strategy generation failed: {e}")
                ai_insights = {
                    "error": "AI analysis temporarily unavailable",
                    "raw_data_available": True
                }

            return {
                "service": "publisher",
                "query": req.query,
                "timestamp": datetime.now().isoformat(),
                "top_keywords": [{"keyword": k[0], "frequency": k[1]} for k in top_keywords],
                "trending_content": [
                    {
                        "title": r.title, 
                        "url": r.url, 
                        "snippet": r.text[:200] if r.text else "No content available",
                        "published_date": getattr(r, 'published_date', None)
                    }
                    for r in trending_content.results[:6]
                ],
                "seo_opportunities": [
                    {
                        "title": r.title, 
                        "url": r.url, 
                        "snippet": r.text[:150] if r.text else "No content available"
                    }
                    for r in seo_content.results[:3]
                ],
                "ai_insights": ai_insights,
                "total_results": len(trending_content.results)
            }

        except Exception as e:
            logger.error(f"Publisher content strategy failed: {e}")
            raise HTTPException(status_code=500, detail=f"Content strategy analysis failed: {str(e)}")

# Create singleton instance
exa_agent = ExaAgent()