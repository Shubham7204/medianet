from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel
from typing import Dict
from sentence_transformers import SentenceTransformer, util
import torch
import logging
import requests
import re
import urllib3
import warnings
import ssl
from urllib.parse import urlparse
from exa_agent import exa_agent, QueryRequest as ExaQueryRequest
from imggen import image_gen_service, AdCampaignRequest

# Disable SSL warnings for competitive analysis
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
warnings.filterwarnings('ignore', message='Unverified HTTPS request')
import json
import os

# Initialize Gemini AI
try:
    import google.generativeai as genai
    
    # Configure Gemini API
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', 'your-gemini-api-key-here')
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel('gemini-pro')
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    print("Google Generative AI not installed. Gemini features will be disabled.")

# Set up logging
logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter()

# Load the model at startup (shared across services)
model = SentenceTransformer('all-MiniLM-L6-v2')

class UserQuery(BaseModel):
    query: str

class CompetitiveIntelligenceRequest(BaseModel):
    query: str
    my_website: str = None
    competitor_website: str = None

# Advertiser data endpoints
@router.get("/impressions")
def get_impressions() -> Dict:
    return {
        "metric": "impressions",
        "value": 20000,
        "description": "How many times your ad was shown",
        "chart_data": {
            "type": "bar",
            "title": "Daily Impressions (Last 7 Days)",
            "labels": ["Sep 20", "Sep 21", "Sep 22", "Sep 23", "Sep 24", "Sep 25", "Sep 26"],
            "data": [18500, 19200, 20000, 19800, 21000, 19500, 20000],
            "backgroundColor": "#4285F4"
        }
    }

@router.get("/clicks")
def get_clicks() -> Dict:
    return {
        "metric": "clicks",
        "value": 1000,
        "ctr": 0.05,
        "description": "How many clicks you got (CTR)",
        "chart_data": {
            "type": "line",
            "title": "Click Performance & CTR Trend",
            "labels": ["Sep 20", "Sep 21", "Sep 22", "Sep 23", "Sep 24", "Sep 25", "Sep 26"],
            "datasets": [
                {
                    "label": "Clicks",
                    "data": [925, 960, 1000, 990, 1050, 975, 1000],
                    "borderColor": "#34A853",
                    "yAxisID": "y"
                },
                {
                    "label": "CTR %",
                    "data": [4.8, 4.9, 5.0, 4.9, 5.1, 4.7, 5.0],
                    "borderColor": "#EA4335",
                    "yAxisID": "y1"
                }
            ]
        }
    }

@router.get("/conversions")
def get_conversions() -> Dict:
    return {
        "metric": "conversions",
        "value": 50,
        "description": "Sign-ups, purchases, or goals completed",
        "chart_data": {
            "type": "funnel",
            "title": "Conversion Funnel",
            "stages": [
                {"name": "Impressions", "value": 20000, "color": "#4285F4"},
                {"name": "Clicks", "value": 1000, "color": "#34A853"},
                {"name": "Conversions", "value": 50, "color": "#FBBC04"},
                {"name": "Completed", "value": 45, "color": "#EA4335"}
            ]
        }
    }

@router.get("/cpc")
def get_cpc() -> Dict:
    return {"metric": "cpc", "value": 0.5, "description": "Cost Per Click"}

@router.get("/cpm")
def get_cpm() -> Dict:
    return {"metric": "cpm", "value": 3.0, "description": "Cost Per Mille"}

@router.get("/cpa")
def get_cpa() -> Dict:
    return {"metric": "cpa", "value": 10.0, "description": "Cost Per Acquisition"}

@router.get("/spend")
def get_spend() -> Dict:
    return {
        "metric": "spend",
        "value": 500.0,
        "description": "Total money spent",
        "chart_data": {
            "type": "doughnut",
            "title": "Ad Spend Breakdown",
            "labels": ["Search Ads", "Display Ads", "Video Ads", "Social Ads"],
            "data": [200, 150, 100, 50],
            "backgroundColor": ["#4285F4", "#34A853", "#FBBC04", "#EA4335"]
        }
    }

@router.get("/roi")
def get_roi() -> Dict:
    return {
        "metric": "roi",
        "value": 2.5,
        "roas": 3.0,
        "description": "ROI / ROAS",
        "chart_data": {
            "type": "gauge",
            "title": "ROI Performance",
            "value": 2.5,
            "max": 5.0,
            "thresholds": [
                {"value": 1.0, "color": "#EA4335", "label": "Poor"},
                {"value": 2.0, "color": "#FBBC04", "label": "Good"},
                {"value": 3.0, "color": "#34A853", "label": "Excellent"}
            ]
        }
    }

# Advertiser-specific configuration
ADVERTISER_KEYWORDS = ["conversions", "cpc", "cpm", "cpa", "spend", "roi", "roas", "advertiser", "ad spend", "advertisement"]

ADVERTISER_METRICS = {
    "impressions": "How many times your ad was shown",
    "clicks": "How many clicks you got (CTR)",
    "conversions": "Sign-ups, purchases, or goals completed",
    "cpc": "Cost Per Click",
    "cpm": "Cost Per Mille",
    "cpa": "Cost Per Acquisition",
    "spend": "Total money spent",
    "roi": "ROI / ROAS"
}

# Function mapping for advertiser
ADVERTISER_FUNCTION_MAP = {
    "impressions": get_impressions,
    "clicks": get_clicks,
    "conversions": get_conversions,
    "cpc": get_cpc,
    "cpm": get_cpm,
    "cpa": get_cpa,
    "spend": get_spend,
    "roi": get_roi
}

# Pre-compute embeddings
advertiser_keywords_embeddings = model.encode(ADVERTISER_KEYWORDS)
advertiser_metric_texts = [f"{key}: {desc}" for key, desc in ADVERTISER_METRICS.items()]
advertiser_metric_keys = list(ADVERTISER_METRICS.keys())
advertiser_metric_embeddings = model.encode(advertiser_metric_texts)

@router.post("/exa-competitive-intelligence")
async def exa_competitive_intelligence(request: ExaQueryRequest):
    """Get AI-powered competitive intelligence using Exa web search."""
    logger.info(f"Advertiser Exa competitive intelligence request: {request.query}")
    
    try:
        result = await exa_agent.advertiser_competitive_intelligence(request)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Exa competitive intelligence failed: {e}")
        raise HTTPException(status_code=500, detail=f"Competitive intelligence analysis failed: {str(e)}")

async def analyze_with_gemini(my_analysis: dict, competitor_analysis: dict, basic_insights: dict) -> dict:
    """Enhance competitive analysis using Gemini AI for deeper insights."""
    if not GEMINI_AVAILABLE:
        return {
            "error": "Gemini AI not available",
            "gemini_insights": "Gemini analysis unavailable - using basic analysis only"
        }
    
    try:
        # Prepare structured data for Gemini analysis
        analysis_prompt = f"""
You are an expert digital marketing and SEO analyst. Analyze the following competitive intelligence data and provide strategic insights.

MY WEBSITE DATA:
- URL: {my_analysis.get('url', 'N/A')}
- Content: {my_analysis.get('word_count', 0)} words, {my_analysis.get('char_count', 0)} characters
- SEO Score: {my_analysis.get('seo_score', 0)}%
- Performance Score: {my_analysis.get('performance_score', 0)}%
- Title Length: {my_analysis.get('title_length', 0)} chars
- Meta Description: {my_analysis.get('meta_desc_length', 0)} chars
- Headings: H1({my_analysis.get('h1_count', 0)}), Total({my_analysis.get('total_headings', 0)})
- Links: {my_analysis.get('link_count', 0)} total, {my_analysis.get('internal_links', 0)} internal, {my_analysis.get('external_links', 0)} external
- Images: {my_analysis.get('image_count', 0)} total, {my_analysis.get('image_alt_text_ratio', 0)}% with alt text
- Social: {my_analysis.get('total_social_mentions', 0)} mentions
- Technical: {my_analysis.get('script_count', 0)} scripts, {my_analysis.get('css_count', 0)} CSS files
- Mobile: {'Optimized' if my_analysis.get('viewport_meta', False) else 'Not optimized'}

COMPETITOR WEBSITE DATA:
- URL: {competitor_analysis.get('url', 'N/A')}
- Content: {competitor_analysis.get('word_count', 0)} words, {competitor_analysis.get('char_count', 0)} characters
- SEO Score: {competitor_analysis.get('seo_score', 0)}%
- Performance Score: {competitor_analysis.get('performance_score', 0)}%
- Title Length: {competitor_analysis.get('title_length', 0)} chars
- Meta Description: {competitor_analysis.get('meta_desc_length', 0)} chars
- Headings: H1({competitor_analysis.get('h1_count', 0)}), Total({competitor_analysis.get('total_headings', 0)})
- Links: {competitor_analysis.get('link_count', 0)} total, {competitor_analysis.get('internal_links', 0)} internal, {competitor_analysis.get('external_links', 0)} external
- Images: {competitor_analysis.get('image_count', 0)} total, {competitor_analysis.get('image_alt_text_ratio', 0)}% with alt text
- Social: {competitor_analysis.get('total_social_mentions', 0)} mentions
- Technical: {competitor_analysis.get('script_count', 0)} scripts, {competitor_analysis.get('css_count', 0)} CSS files
- Mobile: {'Optimized' if competitor_analysis.get('viewport_meta', False) else 'Not optimized'}

PROVIDE ANALYSIS IN THIS JSON FORMAT:
{{
    "competitive_position": "Leading/Trailing/Competitive",
    "overall_score": "1-100",
    "key_strengths": ["strength1", "strength2", "strength3"],
    "critical_weaknesses": ["weakness1", "weakness2", "weakness3"],
    "strategic_recommendations": [
        {{"priority": "High/Medium/Low", "action": "specific action", "impact": "expected impact", "effort": "Low/Medium/High"}}
    ],
    "content_strategy": {{"focus_areas": ["area1", "area2"], "content_gaps": ["gap1", "gap2"]}},
    "seo_strategy": {{"quick_wins": ["win1", "win2"], "long_term": ["strategy1", "strategy2"]}},
    "technical_priorities": ["priority1", "priority2", "priority3"],
    "competitive_threats": ["threat1", "threat2"],
    "market_opportunities": ["opportunity1", "opportunity2"],
    "timeline_recommendations": {{
        "immediate": ["action1", "action2"],
        "30_days": ["action1", "action2"],
        "90_days": ["action1", "action2"]
    }}
}}

Focus on actionable, data-driven insights that will help improve competitive positioning.
"""
        
        response = gemini_model.generate_content(analysis_prompt)
        
        # Extract JSON from response
        response_text = response.text
        
        # Try to extract JSON from the response
        try:
            # Find JSON in the response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            
            if start_idx != -1 and end_idx > start_idx:
                json_str = response_text[start_idx:end_idx]
                gemini_insights = json.loads(json_str)
            else:
                raise ValueError("No JSON found in response")
        except (json.JSONDecodeError, ValueError) as e:
            # Fallback: use the raw text response
            gemini_insights = {
                "error": "Failed to parse structured response",
                "raw_analysis": response_text,
                "competitive_position": "Analysis completed",
                "key_insights": ["Check raw_analysis for detailed insights"]
            }
        
        return {
            "gemini_available": True,
            "gemini_insights": gemini_insights
        }
        
    except Exception as e:
        logger.error(f"Gemini analysis failed: {e}")
        return {
            "error": f"Gemini analysis failed: {str(e)}",
            "gemini_available": False,
            "fallback_insights": "Using basic competitive analysis only"
        }

@router.post("/competitive-intelligence")
async def competitive_intelligence_comparison(request: CompetitiveIntelligenceRequest):
    """Perform detailed competitive intelligence comparison between two websites."""
    logger.info(f"Competitive intelligence comparison: {request.my_website} vs {request.competitor_website}")
    
    try:
        # Import needed modules at the top level
        import requests
        import re
        from urllib.parse import urlparse
        
        # Function to fetch and analyze website with comprehensive metrics
        def analyze_website(url: str) -> dict:
            try:
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ApeleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
                
                # Handle SSL warnings and timeout
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore", urllib3.exceptions.InsecureRequestWarning)
                    response = requests.get(url, headers=headers, timeout=30, verify=False)
                    response.raise_for_status()
                html = response.text
                
                # Enhanced content analysis
                text_content = re.sub(r'<[^>]+>', ' ', html)  # Replace tags with spaces
                text_content = re.sub(r'\s+', ' ', text_content).strip()  # Normalize whitespace
                words = text_content.split()
                word_count = len(words)
                char_count = len(text_content)
                
                # Advanced SEO analysis
                title_match = re.search(r'<title[^>]*>(.*?)</title>', html, re.IGNORECASE | re.DOTALL)
                title = title_match.group(1).strip() if title_match else "No title found"
                title_length = len(title)
                
                # Multiple meta description patterns
                meta_desc_patterns = [
                    r'<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"\'>]*)["\']',
                    r'<meta[^>]*content=["\']([^"\'>]*)["\'][^>]*name=["\']description["\']',
                    r'<meta[^>]*property=["\']og:description["\'][^>]*content=["\']([^"\'>]*)["\']'
                ]
                meta_description = "No meta description"
                for pattern in meta_desc_patterns:
                    match = re.search(pattern, html, re.IGNORECASE)
                    if match:
                        meta_description = match.group(1).strip()
                        break
                meta_desc_length = len(meta_description)
                
                # Comprehensive heading analysis
                h1_matches = re.findall(r'<h1[^>]*>(.*?)</h1>', html, re.IGNORECASE | re.DOTALL)
                h2_matches = re.findall(r'<h2[^>]*>(.*?)</h2>', html, re.IGNORECASE | re.DOTALL)
                h3_matches = re.findall(r'<h3[^>]*>(.*?)</h3>', html, re.IGNORECASE | re.DOTALL)
                
                h1_count = len(h1_matches)
                h2_count = len(h2_matches)
                h3_count = len(h3_matches)
                total_headings = h1_count + h2_count + h3_count
                
                h1_text = [re.sub(r'<[^>]+>', '', h1).strip() for h1 in h1_matches]
                
                # Enhanced technical analysis
                link_count = len(re.findall(r'<a\s+[^>]*href=', html, re.IGNORECASE))
                external_links = len(re.findall(r'<a\s+[^>]*href=["\'][^"\'>]*://(?!(?:www\.)?%s)' % re.escape(urlparse(url).netloc.replace('www.', '')), html, re.IGNORECASE))
                internal_links = max(0, link_count - external_links)
                
                image_count = len(re.findall(r'<img\s+[^>]*src=', html, re.IGNORECASE))
                alt_text_images = len(re.findall(r'<img[^>]*alt=["\'][^"\'>]+["\']', html, re.IGNORECASE))
                image_seo_score = (alt_text_images / image_count * 100) if image_count > 0 else 0
                
                # Social media and contact analysis
                social_patterns = {
                    'facebook': r'(?:facebook\.com|fb\.com)',
                    'twitter': r'(?:twitter\.com|x\.com)',
                    'linkedin': r'linkedin\.com',
                    'instagram': r'instagram\.com',
                    'youtube': r'youtube\.com',
                    'tiktok': r'tiktok\.com',
                    'pinterest': r'pinterest\.com'
                }
                
                social_presence = {}
                total_social_mentions = 0
                for platform, pattern in social_patterns.items():
                    mentions = len(re.findall(pattern, html, re.IGNORECASE))
                    social_presence[platform] = mentions
                    total_social_mentions += mentions
                
                # Enhanced ad and monetization analysis
                ad_patterns = [
                    r'google-ads', r'adsystem', r'doubleclick', r'adsense', 
                    r'advertisement', r'sponsored', r'adnxs', r'amazon-adsystem',
                    r'googlesyndication', r'googletagmanager', r'facebook\.net',
                    r'outbrain', r'taboola', r'media\.net'
                ]
                ad_indicators = sum(len(re.findall(pattern, html, re.IGNORECASE)) for pattern in ad_patterns)
                
                # Performance and technical indicators
                script_count = len(re.findall(r'<script[^>]*>', html, re.IGNORECASE))
                external_scripts = len(re.findall(r'<script[^>]*src=["\'][^"\'>]*://(?!(?:www\.)?%s)' % re.escape(urlparse(url).netloc.replace('www.', '')), html, re.IGNORECASE))
                
                css_count = len(re.findall(r'<link[^>]*rel=["\']stylesheet["\']', html, re.IGNORECASE))
                external_css = len(re.findall(r'<link[^>]*rel=["\']stylesheet["\'][^>]*href=["\'][^"\'>]*://(?!(?:www\.)?%s)' % re.escape(urlparse(url).netloc.replace('www.', '')), html, re.IGNORECASE))
                
                # Content quality indicators
                paragraphs = len(re.findall(r'<p[^>]*>', html, re.IGNORECASE))
                lists = len(re.findall(r'<(?:ul|ol)[^>]*>', html, re.IGNORECASE))
                forms = len(re.findall(r'<form[^>]*>', html, re.IGNORECASE))
                
                # Mobile and responsive indicators
                viewport_meta = len(re.findall(r'<meta[^>]*name=["\']viewport["\']', html, re.IGNORECASE)) > 0
                responsive_images = len(re.findall(r'<img[^>]*(?:srcset|sizes)=', html, re.IGNORECASE))
                
                # Calculate SEO score (0-100)
                seo_factors = {
                    'title_length_optimal': 1 if 30 <= title_length <= 60 else 0,
                    'meta_desc_optimal': 1 if 120 <= meta_desc_length <= 160 else 0,
                    'h1_present': 1 if h1_count > 0 else 0,
                    'heading_structure': 1 if total_headings >= 3 else 0,
                    'image_alt_text': 1 if image_seo_score > 80 else 0,
                    'content_length': 1 if word_count >= 300 else 0
                }
                seo_score = sum(seo_factors.values()) / len(seo_factors) * 100
                
                # Calculate performance score (0-100)
                perf_factors = {
                    'script_count_reasonable': 1 if script_count <= 10 else 0,
                    'external_script_minimal': 1 if external_scripts <= 5 else 0,
                    'css_count_reasonable': 1 if css_count <= 5 else 0,
                    'image_count_reasonable': 1 if image_count <= 50 else 0
                }
                performance_score = sum(perf_factors.values()) / len(perf_factors) * 100
                
                return {
                    "url": url,
                    "domain": urlparse(url).netloc,
                    "title": title,
                    "title_length": title_length,
                    "meta_description": meta_description,
                    "meta_desc_length": meta_desc_length,
                    "word_count": word_count,
                    "char_count": char_count,
                    "h1_count": h1_count,
                    "h2_count": h2_count,
                    "h3_count": h3_count,
                    "total_headings": total_headings,
                    "h1_headings": h1_text[:3],
                    "link_count": link_count,
                    "internal_links": internal_links,
                    "external_links": external_links,
                    "image_count": image_count,
                    "image_alt_text_ratio": round(image_seo_score, 1),
                    "social_presence": social_presence,
                    "total_social_mentions": total_social_mentions,
                    "ad_indicators": ad_indicators,
                    "script_count": script_count,
                    "external_scripts": external_scripts,
                    "css_count": css_count,
                    "external_css": external_css,
                    "paragraphs": paragraphs,
                    "lists": lists,
                    "forms": forms,
                    "viewport_meta": viewport_meta,
                    "responsive_images": responsive_images,
                    "seo_score": round(seo_score, 1),
                    "performance_score": round(performance_score, 1),
                    "analysis_timestamp": "2025-09-27T10:30:00Z"
                }
                
            except Exception as e:
                logger.error(f"Website analysis failed for {url}: {e}")
                return {
                    "url": url,
                    "error": f"Analysis failed: {str(e)}",
                    "domain": urlparse(url).netloc if url else "unknown"
                }
        
        # Analyze both websites
        my_analysis = analyze_website(request.my_website) if request.my_website else None
        competitor_analysis = analyze_website(request.competitor_website) if request.competitor_website else None
        
        # Generate comprehensive competitive insights
        if my_analysis and competitor_analysis and 'error' not in my_analysis and 'error' not in competitor_analysis:
            # Safe field access with defaults
            def safe_get(data, field, default=0):
                return data.get(field, default) if data else default
            
            # Detailed performance comparison
            performance_comparison = {
                "content_metrics": {
                    "word_count": {
                        "my_site": my_analysis["word_count"],
                        "competitor": competitor_analysis["word_count"],
                        "winner": "my_site" if my_analysis["word_count"] > competitor_analysis["word_count"] else "competitor",
                        "difference": abs(my_analysis["word_count"] - competitor_analysis["word_count"])
                    },
                    "content_structure": {
                        "my_site_headings": safe_get(my_analysis, "total_headings"),
                        "competitor_headings": safe_get(competitor_analysis, "total_headings"),
                        "my_site_paragraphs": safe_get(my_analysis, "paragraphs"),
                        "competitor_paragraphs": safe_get(competitor_analysis, "paragraphs")
                    }
                },
                "seo_comparison": {
                    "my_site_score": safe_get(my_analysis, "seo_score"),
                    "competitor_score": safe_get(competitor_analysis, "seo_score"),
                    "winner": "my_site" if safe_get(my_analysis, "seo_score") > safe_get(competitor_analysis, "seo_score") else "competitor",
                    "gap": abs(safe_get(my_analysis, "seo_score") - safe_get(competitor_analysis, "seo_score"))
                },
                "technical_comparison": {
                    "my_site_performance": safe_get(my_analysis, "performance_score"),
                    "competitor_performance": safe_get(competitor_analysis, "performance_score"),
                    "winner": "my_site" if safe_get(my_analysis, "performance_score") > safe_get(competitor_analysis, "performance_score") else "competitor"
                },
                "social_engagement": {
                    "my_site": safe_get(my_analysis, "total_social_mentions"),
                    "competitor": safe_get(competitor_analysis, "total_social_mentions"),
                    "winner": "my_site" if safe_get(my_analysis, "total_social_mentions") > safe_get(competitor_analysis, "total_social_mentions") else "competitor"
                },
                "monetization_indicators": {
                    "my_site_ads": my_analysis["ad_indicators"],
                    "competitor_ads": competitor_analysis["ad_indicators"],
                    "my_site_more_monetized": my_analysis["ad_indicators"] > competitor_analysis["ad_indicators"]
                }
            }
            
            # Strategic recommendations
            recommendations = []
            priority_actions = []
            
            # Content recommendations
            word_diff = safe_get(competitor_analysis, "word_count") - safe_get(my_analysis, "word_count")
            if word_diff > 500:
                priority_actions.append(f"URGENT: Increase content by {word_diff} words to match competitor depth")
                recommendations.append(f"Content Gap: Competitor has {word_diff} more words - consider adding detailed sections, FAQs, or comprehensive guides")
            elif word_diff > 200:
                recommendations.append(f"Content Enhancement: Add {word_diff} more words of quality content to match competitor")
            
            # SEO recommendations
            seo_gap = safe_get(competitor_analysis, "seo_score") - safe_get(my_analysis, "seo_score")
            if seo_gap > 20:
                priority_actions.append(f"URGENT: SEO optimization needed - competitor leads by {seo_gap:.1f} points")
            
            title_length = safe_get(my_analysis, "title_length")
            if title_length > 60:
                recommendations.append(f"Title Optimization: Shorten title from {title_length} to under 60 characters")
            
            meta_desc_length = safe_get(my_analysis, "meta_desc_length")
            if meta_desc_length > 160 or meta_desc_length < 120:
                recommendations.append(f"Meta Description: Optimize length (current: {meta_desc_length}, optimal: 120-160 chars)")
            
            h1_count = safe_get(my_analysis, "h1_count")
            competitor_h1 = safe_get(competitor_analysis, "h1_count")
            if h1_count == 0:
                priority_actions.append("CRITICAL: Add H1 heading - essential for SEO")
            elif competitor_h1 > h1_count:
                recommendations.append(f"Heading Structure: Add more H1 headings (competitor has {competitor_h1} vs your {h1_count})")
            
            # Image optimization
            image_alt_ratio = safe_get(my_analysis, "image_alt_text_ratio")
            if image_alt_ratio < 80:
                recommendations.append(f"Image SEO: Add alt text to images (current: {image_alt_ratio:.1f}% coverage)")
            
            # Social media recommendations
            social_gap = safe_get(competitor_analysis, "total_social_mentions") - safe_get(my_analysis, "total_social_mentions")
            if social_gap > 5:
                recommendations.append(f"Social Media: Increase social integration - competitor has {social_gap} more social mentions")
            
            # Technical recommendations
            my_perf = safe_get(my_analysis, "performance_score")
            comp_perf = safe_get(competitor_analysis, "performance_score")
            if my_perf < comp_perf:
                perf_gap = comp_perf - my_perf
                recommendations.append(f"Technical Performance: Optimize page speed - competitor leads by {perf_gap:.1f} points")
            
            script_count = safe_get(my_analysis, "script_count")
            if script_count > 15:
                recommendations.append(f"Performance: Reduce script count from {script_count} for better page speed")
            
            viewport_meta = safe_get(my_analysis, "viewport_meta", False)
            if not viewport_meta:
                priority_actions.append("URGENT: Add viewport meta tag for mobile optimization")
            
            # Competitive advantages to leverage
            advantages = []
            if safe_get(my_analysis, "word_count") > safe_get(competitor_analysis, "word_count"):
                advantages.append(f"Content Volume: You have {abs(word_diff)} more words than competitor")
            
            if safe_get(my_analysis, "seo_score") > safe_get(competitor_analysis, "seo_score"):
                advantages.append(f"SEO Optimization: You lead by {abs(seo_gap):.1f} points")
            
            if safe_get(my_analysis, "total_social_mentions") > safe_get(competitor_analysis, "total_social_mentions"):
                advantages.append(f"Social Integration: You have {abs(social_gap)} more social mentions")
            
            if safe_get(my_analysis, "performance_score") > safe_get(competitor_analysis, "performance_score"):
                advantages.append("Technical Performance: Your site performs better")
            
            insights = {
                "performance_comparison": performance_comparison,
                "priority_actions": priority_actions,
                "recommendations": recommendations,
                "competitive_advantages": advantages,
                "overall_assessment": {
                    "leading_areas": len(advantages),
                    "improvement_areas": len(recommendations),
                    "critical_issues": len(priority_actions)
                }
            }
        else:
            insights = {"error": "Could not generate insights due to analysis errors"}
        
        # Enhance with Gemini AI analysis
        gemini_analysis = await analyze_with_gemini(my_analysis, competitor_analysis, insights)
        
        # Prepare response in the format expected by frontend
        response_data = {
            "service": "competitive_intelligence",
            "query": request.query,
            "comparison": {
                "my_website": my_analysis,
                "competitor_website": competitor_analysis
            },
            "insights": insights,
            "gemini_analysis": gemini_analysis,
            "ai_insights": {
                "strategic_assessment": {
                    "overall_position": "Leading" if insights.get("overall_assessment", {}).get("leading_areas", 0) > insights.get("overall_assessment", {}).get("improvement_areas", 0) else "Trailing" if insights.get("overall_assessment", {}).get("improvement_areas", 0) > insights.get("overall_assessment", {}).get("leading_areas", 0) else "Competitive",
                    "confidence_level": "High" if len(insights.get("competitive_advantages", [])) >= 3 else "Medium" if len(insights.get("competitive_advantages", [])) >= 1 else "Low",
                    "immediate_threats": len(insights.get("priority_actions", [])),
                    "growth_opportunities": len(insights.get("recommendations", []))
                },
                "market_gaps": [
                    f"Content Strategy: {abs(my_analysis.get('word_count', 0) - competitor_analysis.get('word_count', 0))} word gap {'(expand content)' if competitor_analysis.get('word_count', 0) > my_analysis.get('word_count', 0) else '(content advantage)'}" if my_analysis and competitor_analysis else "Content analysis incomplete",
                    f"SEO Optimization: {abs(my_analysis.get('seo_score', 0) - competitor_analysis.get('seo_score', 0)):.1f} point {'gap (needs improvement)' if competitor_analysis.get('seo_score', 0) > my_analysis.get('seo_score', 0) else 'advantage (maintain lead)'}" if my_analysis and competitor_analysis else "SEO comparison unavailable",
                    f"Technical Performance: {abs(my_analysis.get('performance_score', 0) - competitor_analysis.get('performance_score', 0)):.1f} point {'gap (optimize performance)' if competitor_analysis.get('performance_score', 0) > my_analysis.get('performance_score', 0) else 'advantage (technical edge)'}" if my_analysis and competitor_analysis else "Performance data unavailable",
                    f"Social Integration: {abs(my_analysis.get('total_social_mentions', 0) - competitor_analysis.get('total_social_mentions', 0))} mention {'deficit (expand social presence)' if competitor_analysis.get('total_social_mentions', 0) > my_analysis.get('total_social_mentions', 0) else 'advantage (strong social game)'}" if my_analysis and competitor_analysis else "Social analysis incomplete"
                ],
                "key_differentiators": [
                    f"Content Volume: {my_analysis.get('word_count', 0):,} words ({my_analysis.get('char_count', 0):,} characters)" if my_analysis else "Content metrics unavailable",
                    f"SEO Foundation: {my_analysis.get('seo_score', 0):.1f}% optimization score with {my_analysis.get('total_headings', 0)} structured headings" if my_analysis else "SEO data unavailable",
                    f"Technical Stack: {my_analysis.get('script_count', 0)} scripts, {my_analysis.get('css_count', 0)} CSS files, Performance: {my_analysis.get('performance_score', 0):.1f}%" if my_analysis else "Technical data unavailable",
                    f"Link Profile: {my_analysis.get('link_count', 0)} total links ({my_analysis.get('internal_links', 0)} internal, {my_analysis.get('external_links', 0)} external)" if my_analysis else "Link data unavailable",
                    f"Media Strategy: {my_analysis.get('image_count', 0)} images with {my_analysis.get('image_alt_text_ratio', 0):.1f}% alt text coverage" if my_analysis else "Media data unavailable"
                ],
                "target_audience": f"Based on content analysis of {my_analysis.get('word_count', 0)} words and {my_analysis.get('total_headings', 0)} structured sections, focus on users seeking comprehensive information. Optimize for mobile users {'(viewport configured)' if my_analysis.get('viewport_meta', False) else '(needs mobile optimization)'} and enhance engagement through improved content structure and social integration." if my_analysis else "Target audience analysis requires successful website analysis",
                "competitive_advantage": f"{'Leverage your strengths in: ' + ', '.join(insights.get('competitive_advantages', [])) + '. ' if insights.get('competitive_advantages') else ''}Address critical gaps through: {', '.join(insights.get('priority_actions', [])[:3]) + '.' if insights.get('priority_actions') else 'Focus on content optimization and technical improvements.'} Strategic focus: {'Content expansion and SEO optimization' if competitor_analysis.get('word_count', 0) > my_analysis.get('word_count', 0) else 'Maintain content leadership while optimizing technical performance'}" if my_analysis and competitor_analysis else "Competitive analysis requires successful data collection from both websites"
            },
            "website_comparison": {
                "metrics": [
                    {
                        "category": "Content Quality",
                        "metric": "Content Volume (words)",
                        "my_site": my_analysis.get("word_count", 0) if my_analysis else 0,
                        "competitor": competitor_analysis.get("word_count", 0) if competitor_analysis else 0
                    },
                    {
                        "category": "Content Quality",
                        "metric": "Character Count",
                        "my_site": my_analysis.get("char_count", 0) if my_analysis else 0,
                        "competitor": competitor_analysis.get("char_count", 0) if competitor_analysis else 0
                    },
                    {
                        "category": "Content Structure",
                        "metric": "Total Headings (H1-H3)",
                        "my_site": my_analysis.get("total_headings", 0) if my_analysis else 0,
                        "competitor": competitor_analysis.get("total_headings", 0) if competitor_analysis else 0
                    },
                    {
                        "category": "Content Structure",
                        "metric": "H1 Headings",
                        "my_site": my_analysis.get("h1_count", 0) if my_analysis else 0,
                        "competitor": competitor_analysis.get("h1_count", 0) if competitor_analysis else 0
                    },
                    {
                        "category": "Content Structure",
                        "metric": "Paragraphs",
                        "my_site": my_analysis.get("paragraphs", 0) if my_analysis else 0,
                        "competitor": competitor_analysis.get("paragraphs", 0) if competitor_analysis else 0
                    },
                    {
                        "category": "SEO Optimization",
                        "metric": "Title Length (chars)",
                        "my_site": my_analysis.get("title_length", 0) if my_analysis else 0,
                        "competitor": competitor_analysis.get("title_length", 0) if competitor_analysis else 0
                    },
                    {
                        "category": "SEO Optimization",
                        "metric": "Meta Description Length",
                        "my_site": my_analysis.get("meta_desc_length", 0) if my_analysis else 0,
                        "competitor": competitor_analysis.get("meta_desc_length", 0) if competitor_analysis else 0
                    },
                    {
                        "category": "SEO Optimization",
                        "metric": "SEO Score (%)",
                        "my_site": my_analysis.get("seo_score", 0) if my_analysis else 0,
                        "competitor": competitor_analysis.get("seo_score", 0) if competitor_analysis else 0
                    },
                    {
                        "category": "Link Profile",
                        "metric": "Total Links",
                        "my_site": my_analysis.get("link_count", 0) if my_analysis else 0,
                        "competitor": competitor_analysis.get("link_count", 0) if competitor_analysis else 0
                    },
                    {
                        "category": "Link Profile",
                        "metric": "Internal Links",
                        "my_site": my_analysis.get("internal_links", 0) if my_analysis else 0,
                        "competitor": competitor_analysis.get("internal_links", 0) if competitor_analysis else 0
                    },
                    {
                        "category": "Link Profile",
                        "metric": "External Links",
                        "my_site": my_analysis.get("external_links", 0) if my_analysis else 0,
                        "competitor": competitor_analysis.get("external_links", 0) if competitor_analysis else 0
                    },
                    {
                        "category": "Media & Images",
                        "metric": "Images Count",
                        "my_site": my_analysis.get("image_count", 0) if my_analysis else 0,
                        "competitor": competitor_analysis.get("image_count", 0) if competitor_analysis else 0
                    },
                    {
                        "category": "Media & Images",
                        "metric": "Image Alt Text Coverage (%)",
                        "my_site": my_analysis.get("image_alt_text_ratio", 0) if my_analysis else 0,
                        "competitor": competitor_analysis.get("image_alt_text_ratio", 0) if competitor_analysis else 0
                    },
                    {
                        "category": "Social Media",
                        "metric": "Total Social Mentions",
                        "my_site": my_analysis.get("total_social_mentions", 0) if my_analysis else 0,
                        "competitor": competitor_analysis.get("total_social_mentions", 0) if competitor_analysis else 0
                    },
                    {
                        "category": "Technical Performance",
                        "metric": "Performance Score (%)",
                        "my_site": my_analysis.get("performance_score", 0) if my_analysis else 0,
                        "competitor": competitor_analysis.get("performance_score", 0) if competitor_analysis else 0
                    },
                    {
                        "category": "Technical Performance",
                        "metric": "Script Count",
                        "my_site": my_analysis.get("script_count", 0) if my_analysis else 0,
                        "competitor": competitor_analysis.get("script_count", 0) if competitor_analysis else 0
                    },
                    {
                        "category": "Technical Performance",
                        "metric": "CSS Files",
                        "my_site": my_analysis.get("css_count", 0) if my_analysis else 0,
                        "competitor": competitor_analysis.get("css_count", 0) if competitor_analysis else 0
                    },
                    {
                        "category": "Monetization",
                        "metric": "Ad Indicators",
                        "my_site": my_analysis.get("ad_indicators", 0) if my_analysis else 0,
                        "competitor": competitor_analysis.get("ad_indicators", 0) if competitor_analysis else 0
                    },
                    {
                        "category": "User Experience",
                        "metric": "Forms Count",
                        "my_site": my_analysis.get("forms", 0) if my_analysis else 0,
                        "competitor": competitor_analysis.get("forms", 0) if competitor_analysis else 0
                    },
                    {
                        "category": "User Experience",
                        "metric": "Mobile Optimized",
                        "my_site": 1 if my_analysis.get("viewport_meta", False) else 0 if my_analysis else 0,
                        "competitor": 1 if competitor_analysis.get("viewport_meta", False) else 0 if competitor_analysis else 0
                    }
                ]
            }
        }
        
        return response_data
        
    except Exception as e:
        logger.error(f"Competitive intelligence comparison failed: {e}")
        raise HTTPException(status_code=500, detail=f"Competitive intelligence comparison failed: {str(e)}")

@router.post("/analyze-campaign")
async def analyze_campaign(request: AdCampaignRequest):
    """Analyze ad campaign data with AI insights."""
    logger.info(f"Advertiser campaign analysis request for domain: {request.domain}")
    
    try:
        result = await image_gen_service.analyze_campaign(request)
        return {
            "service": "advertiser",
            "analysis_type": "campaign_analysis",
            "domain": request.domain,
            "banner_size": request.banner_size,
            "analysis": result.dict(),
            "timestamp": "2025-09-27T10:30:00Z"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Campaign analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Campaign analysis failed: {str(e)}")

@router.post("/generate-banner-concept")
async def generate_banner_concept(request: AdCampaignRequest):
    """Generate banner concept and creative suggestions."""
    logger.info(f"Banner concept generation request for {request.banner_size} banner")
    
    try:
        result = await image_gen_service.generate_banner_concept(request)
        return {
            "service": "advertiser",
            "generation_type": "banner_concept",
            "domain": request.domain,
            "banner_size": request.banner_size,
            "result": result,
            "timestamp": "2025-09-27T10:30:00Z"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Banner concept generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Banner concept generation failed: {str(e)}")

@router.post("/generate-banner-image")
async def generate_banner_image(request: AdCampaignRequest):
    """Generate actual banner image file."""
    logger.info(f"Banner image generation request for {request.banner_size} banner")
    
    try:
        # Return the image directly as HTTP response
        return await image_gen_service.generate_banner_image_response(request)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Banner image generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Banner image generation failed: {str(e)}")

@router.post("/query")
async def handle_advertiser_query(user_query: UserQuery):
    """Handle natural language queries for advertiser metrics."""
    query = user_query.query.lower()
    
    # Direct match check
    if query in advertiser_metric_keys:
        result = ADVERTISER_FUNCTION_MAP[query]()
    else:
        # Semantic search for metric
        query_embedding = model.encode(query)
        metric_similarities = util.cos_sim(query_embedding, advertiser_metric_embeddings)[0]
        max_similarity_idx = torch.argmax(metric_similarities).item()
        max_similarity = metric_similarities[max_similarity_idx].item()

        if max_similarity < 0.3:  # Threshold for minimum relevance
            return {"error": "No matching advertiser metric found. Try asking about impressions, clicks, conversions, CPC, CPM, CPA, spend, or ROI."}

        found_metric = advertiser_metric_keys[max_similarity_idx]
        result = ADVERTISER_FUNCTION_MAP[found_metric]()
    
    # Add chart context
    result["chat_response"] = f"Here's your {result['metric']} data with visualization"
    result["timestamp"] = "2025-09-26T10:30:00Z"
    
    return result

@router.get("/")
def advertiser_info():
    """Get advertiser service information."""
    return {
        "service": "advertiser",
        "description": "Advertiser campaign metrics and performance data",
        "available_metrics": list(ADVERTISER_METRICS.keys()),
        "endpoints": {
            "/query": "Natural language query endpoint",
            "/exa-competitive-intelligence": "AI-powered competitive intelligence using web search",
            "/competitive-intelligence": "Website comparison and competitive analysis",
            "/analyze-campaign": "AI-powered ad campaign analysis",
            "/generate-banner-concept": "Generate banner concept and creative suggestions",
            "/generate-banner-image": "Generate actual banner image (PNG format)",
            "/impressions": "Ad impression data",
            "/clicks": "Click data and CTR",
            "/conversions": "Conversion tracking data",
            "/cpc": "Cost per click data",
            "/cpm": "Cost per mille data",
            "/cpa": "Cost per acquisition data",
            "/spend": "Total ad spend data",
            "/roi": "Return on investment data"
        }
    }