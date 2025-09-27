from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl
from typing import Dict
from sentence_transformers import SentenceTransformer, util
from urllib.parse import urlparse
import torch
import asyncio
import os
import json
import re
import sys
import requests
from playwright.async_api import async_playwright
import google.generativeai as genai
from dotenv import load_dotenv
import logging
from exa_agent import exa_agent, QueryRequest as ExaQueryRequest

# Set up logging
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize router
router = APIRouter()

# Load the model at startup (shared across services)
model = SentenceTransformer('all-MiniLM-L6-v2')

# Global variables for website analysis
playwright_available = False
gemini_model = None

class UserQuery(BaseModel):
    query: str

class URLRequest(BaseModel):
    url: HttpUrl

# Initialize Gemini and Playwright
def initialize_services():
    """Initialize Gemini and Playwright services."""
    global playwright_available, gemini_model
    
    # Initialize Gemini
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if api_key:
        try:
            genai.configure(api_key=api_key)
            gemini_model = genai.GenerativeModel("gemini-2.5-flash")
            logger.info(f"✅ Gemini API configured for publisher service")
        except Exception as e:
            logger.error(f"❌ Failed to configure Gemini: {e}")
            gemini_model = None
    
    # Test Playwright
    if sys.platform == "win32" and sys.version_info >= (3, 13):
        playwright_available = False
        logger.info("🔄 Publisher service using HTTP fallback method")
    else:
        try:
            # This would need to be called in an async context
            playwright_available = True
            logger.info("✅ Playwright available for publisher service")
        except Exception:
            playwright_available = False

# Call initialization
initialize_services()

# Website analysis utility functions
def fetch_basic_html(url: str):
    """Fallback method using requests for basic HTML fetching."""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=30, verify=False)
        response.raise_for_status()
        html = response.text
        
        # Basic script and iframe extraction from static HTML
        script_pattern = r'<script[^>]*src=["\']([^"\']+)["\'][^>]*>'
        iframe_pattern = r'<iframe[^>]*src=["\']([^"\']+)["\'][^>]*>'
        
        external_scripts = re.findall(script_pattern, html)
        iframes = re.findall(iframe_pattern, html)
        
        # Count inline scripts
        inline_script_pattern = r'<script(?![^>]*src=)[^>]*>.*?</script>'
        inline_scripts = re.findall(inline_script_pattern, html, re.DOTALL)
        
        scripts = external_scripts + ['inline'] * len(inline_scripts)
        
        return html, scripts, iframes
    except Exception as e:
        logger.error(f"Fallback fetch error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch URL: {str(e)}")

async def fetch_rendered_html(url: str):
    """Fetch HTML using Playwright for full rendering."""
    try:
        async with async_playwright() as p:
            logger.info(f"Launching browser for URL: {url}")
            
            launch_options = {
                'headless': True,
                'args': [
                    '--no-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--disable-software-rasterizer',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor'
                ]
            }
            
            if sys.platform == "win32":
                launch_options['args'].extend([
                    '--disable-extensions',
                    '--no-first-run',
                    '--disable-default-apps'
                ])
            
            browser = await p.chromium.launch(**launch_options)
            context = await browser.new_context(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            )
            page = await context.new_page()
            
            try:
                logger.info(f"Navigating to: {url}")
                await page.goto(url, wait_until="domcontentloaded", timeout=30000)
                await page.wait_for_timeout(2000)  # Wait for JS to execute
                
                logger.info("Page loaded, extracting content...")
                html = await page.content()
                
                scripts = await page.evaluate("""
                    () => Array.from(document.scripts).map(s => s.src || 'inline')
                """)
                
                iframes = await page.evaluate("""
                    () => Array.from(document.querySelectorAll('iframe')).map(f => f.src).filter(src => src)
                """)
                
                logger.info("Content extracted successfully")
                
            except Exception as e:
                logger.error(f"Error during page operations: {e}")
                raise HTTPException(status_code=500, detail=f"Error fetching page: {str(e)}")
            finally:
                await browser.close()
                
            return html, scripts, iframes
            
    except Exception as e:
        logger.error(f"Error launching browser: {e}")
        raise HTTPException(status_code=500, detail=f"Browser launch error: {str(e)}")

def sanitize_html(html: str) -> str:
    """Remove script contents and truncate."""
    html = re.sub(r"<script[^>]*>.*?</script>", "<script>/* content removed */</script>", html, flags=re.DOTALL|re.IGNORECASE)
    html = re.sub(r"<style[^>]*>.*?</style>", "<style>/* content removed */</style>", html, flags=re.DOTALL|re.IGNORECASE)
    return html[:50000]

def prepare_gemini_prompt(url: str, html: str, scripts: list, iframes: list) -> str:
    """Prepare the prompt for Gemini analysis."""
    external_scripts = [s for s in scripts if s != "inline" and s]
    inline_scripts_count = sum(1 for s in scripts if s == "inline")
    
    # Truncate HTML more aggressively to leave room for response
    html_sample = html[:20000] if len(html) > 20000 else html
    
    return f"""Analyze this website for security, SEO, and ad placement opportunities.

URL: {url}
HTML (sample): {html_sample}
Scripts: {len(external_scripts)} external, {inline_scripts_count} inline
Iframes: {len(iframes)}

Return JSON with exactly these keys:
{{
  "vulns": [
    {{"issue": "brief description", "risk": "High/Medium/Low", "remediation": "how to fix"}}
  ],
  "seo": [
    {{"issue": "what's missing/wrong", "recommendation": "what to do", "priority": "High/Medium/Low"}}
  ],
  "ads": [
    {{"location": "where to place", "format": "ad size", "reasoning": "why this works"}}
  ],
  "confidence": 85
}}

Focus on the top 3-4 most important items in each category. Be concise but actionable."""

def call_gemini(prompt: str) -> dict:
    """Call Gemini API and return parsed response."""
    global gemini_model
    
    if not gemini_model:
        return {"error": "Gemini API not configured", "details": "Missing API key or initialization failed"}
    
    try:
        response = gemini_model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.1,
                max_output_tokens=8000,  # Increased token limit
                response_mime_type="application/json"
            )
        )
        
        if not response.text:
            return {"error": "Empty response from Gemini", "details": "The API returned no content"}
        
        # Clean up the response text to ensure valid JSON
        response_text = response.text.strip()
        
        # Check if response is truncated and try to fix common issues
        if not response_text.endswith('}') and not response_text.endswith(']'):
            logger.warning("Response appears to be truncated, attempting to fix...")
            
            # Find the last complete object/array
            last_brace = response_text.rfind('}')
            last_bracket = response_text.rfind(']')
            
            if last_brace > last_bracket:
                # Truncate at last complete object
                response_text = response_text[:last_brace + 1]
                # Add missing closing braces if needed
                open_braces = response_text.count('{') - response_text.count('}')
                if open_braces > 0:
                    response_text += '}' * open_braces
            elif last_bracket > 0:
                # Truncate at last complete array
                response_text = response_text[:last_bracket + 1]
                # Add missing closing brackets and braces if needed
                open_brackets = response_text.count('[') - response_text.count(']')
                open_braces = response_text.count('{') - response_text.count('}')
                if open_brackets > 0:
                    response_text += ']' * open_brackets
                if open_braces > 0:
                    response_text += '}' * open_braces
        
        try:
            parsed_json = json.loads(response_text)
            return parsed_json
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {e}")
            logger.error(f"Problematic JSON: {response_text[:500]}...")
            
            # Return partial results with error info
            return {
                "error": "Invalid JSON response from Gemini",
                "details": f"Parse error at position {e.pos}: {str(e)}",
                "raw_output": response_text,
                # Try to extract partial information
                "partial_analysis": True
            }
            
    except Exception as e:
        logger.error(f"Gemini API call failed: {e}")
        return {"error": "Gemini API call failed", "details": str(e)}

# Publisher data endpoints
@router.get("/impressions")
def get_impressions() -> Dict:
    return {
        "metric": "impressions",
        "value": 10000,
        "description": "How many times ads were shown",
        "chart_data": {
            "type": "bar",
            "title": "Daily Impressions (Last 7 Days)",
            "labels": ["Sep 20", "Sep 21", "Sep 22", "Sep 23", "Sep 24", "Sep 25", "Sep 26"],
            "data": [9500, 9800, 10000, 9900, 10200, 9700, 10000],
            "backgroundColor": "#4285F4"
        }
    }

@router.get("/clicks")
def get_clicks() -> Dict:
    return {
        "metric": "clicks",
        "value": 500,
        "ctr": 0.05,
        "description": "How many times ads were clicked (CTR)",
        "chart_data": {
            "type": "line",
            "title": "Click Performance & CTR Trend",
            "labels": ["Sep 20", "Sep 21", "Sep 22", "Sep 23", "Sep 24", "Sep 25", "Sep 26"],
            "datasets": [
                {
                    "label": "Clicks",
                    "data": [475, 490, 500, 495, 510, 485, 500],
                    "borderColor": "#34A853",
                    "yAxisID": "y"
                },
                {
                    "label": "CTR %",
                    "data": [5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0],
                    "borderColor": "#EA4335",
                    "yAxisID": "y1"
                }
            ]
        }
    }

@router.get("/revenue")
def get_revenue() -> Dict:
    return {
        "metric": "revenue",
        "daily": 100.0,
        "monthly": 3000.0,
        "site_wise": {"site1": 1500.0, "site2": 1500.0},
        "description": "Revenue / Earnings (daily, monthly, site-wise)",
        "chart_data": {
            "primary": {
                "type": "area",
                "title": "Revenue Trend (Last 7 Days)",
                "labels": ["Sep 20", "Sep 21", "Sep 22", "Sep 23", "Sep 24", "Sep 25", "Sep 26"],
                "data": [95, 98, 100, 105, 102, 98, 100],
                "backgroundColor": "rgba(52, 168, 83, 0.2)",
                "borderColor": "#34A853"
            },
            "secondary": {
                "type": "bar",
                "title": "Site-wise Revenue Comparison",
                "labels": ["Site 1", "Site 2", "Site 3", "Site 4"],
                "data": [1500, 1500, 800, 700],
                "backgroundColor": ["#4285F4", "#34A853", "#FBBC04", "#EA4335"]
            }
        }
    }

@router.get("/rpm")
def get_rpm() -> Dict:
    return {
        "metric": "rpm",
        "value": 5.0,
        "ecpm": 4.8,
        "description": "RPM / eCPM (revenue per 1000 impressions)",
        "chart_data": {
            "type": "bar",
            "title": "RPM vs eCPM Comparison",
            "labels": ["Week 1", "Week 2", "Week 3", "Week 4"],
            "datasets": [
                {
                    "label": "RPM",
                    "data": [4.8, 4.9, 5.0, 5.1],
                    "backgroundColor": "#4285F4"
                },
                {
                    "label": "eCPM",
                    "data": [4.5, 4.6, 4.8, 4.9],
                    "backgroundColor": "#34A853"
                }
            ]
        }
    }

@router.get("/geography")
def get_geography() -> Dict:
    return {
        "metric": "geography",
        "breakdown": {"US": 60, "EU": 30, "Other": 10},
        "device": {"desktop": 40, "mobile": 60},
        "description": "Geography / Device breakdown",
        "chart_data": {
            "geography": {
                "type": "pie",
                "title": "Revenue by Geography",
                "labels": ["United States", "Europe", "Asia", "Others"],
                "data": [60, 30, 7, 3],
                "backgroundColor": ["#4285F4", "#34A853", "#FBBC04", "#EA4335"]
            },
            "device": {
                "type": "doughnut",
                "title": "Traffic by Device",
                "labels": ["Mobile", "Desktop", "Tablet"],
                "data": [60, 35, 5],
                "backgroundColor": ["#34A853", "#4285F4", "#FBBC04"]
            }
        }
    }

# Publisher-specific configuration
PUBLISHER_KEYWORDS = ["revenue", "earnings", "rpm", "ecpm", "geography", "device", "site-wise", "site", "publisher", "production"]

PUBLISHER_METRICS = {
    "impressions": "How many times ads were shown",
    "clicks": "How many times ads were clicked (CTR)",
    "revenue": "Revenue / Earnings (daily, monthly, site-wise)",
    "rpm": "RPM / eCPM (revenue per 1000 impressions)",
    "geography": "Geography / Device breakdown"
}

# Function mapping for publisher
PUBLISHER_FUNCTION_MAP = {
    "impressions": get_impressions,
    "clicks": get_clicks,
    "revenue": get_revenue,
    "rpm": get_rpm,
    "geography": get_geography
}

# Pre-compute embeddings
publisher_keywords_embeddings = model.encode(PUBLISHER_KEYWORDS)
publisher_metric_texts = [f"{key}: {desc}" for key, desc in PUBLISHER_METRICS.items()]
publisher_metric_keys = list(PUBLISHER_METRICS.keys())
publisher_metric_embeddings = model.encode(publisher_metric_texts)

@router.post("/analyze")
async def analyze_site(request: URLRequest):
    """Analyze a website for security, SEO, and ad opportunities."""
    url = str(request.url)
    logger.info(f"Publisher analyzing URL: {url}")
    
    try:
        # Fetch HTML content
        if playwright_available:
            try:
                html, scripts, iframes = await fetch_rendered_html(url)
                fetch_method = "playwright"
            except Exception as playwright_error:
                logger.warning(f"Playwright failed: {playwright_error}")
                logger.info("Falling back to basic HTTP request...")
                html, scripts, iframes = fetch_basic_html(url)
                fetch_method = "fallback"
        else:
            logger.info("Using fallback HTTP method")
            html, scripts, iframes = fetch_basic_html(url)
            fetch_method = "fallback"
        
        # Sanitize HTML
        sanitized_html = sanitize_html(html)
        
        # Prepare prompt and call Gemini
        prompt = prepare_gemini_prompt(url, sanitized_html, scripts, iframes)
        report = call_gemini(prompt)
        
        # Add metadata to response
        report["fetch_method"] = fetch_method
        report["url"] = url
        report["service"] = "publisher"
        
        logger.info(f"Website analysis completed for {url}")
        return {"url": url, "report": report}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis failed for {url}: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.post("/exa-content-strategy")
async def exa_content_strategy(request: ExaQueryRequest):
    """Get AI-powered content strategy using Exa web search."""
    logger.info(f"Publisher Exa content strategy request: {request.query}")
    
    try:
        result = await exa_agent.publisher_content_strategy(request)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Exa content strategy failed: {e}")
        raise HTTPException(status_code=500, detail=f"Content strategy analysis failed: {str(e)}")
    

class CompetitiveAnalysisRequest(BaseModel):
    url: HttpUrl

class MultiCompetitiveAnalysisRequest(BaseModel):
    my_website: HttpUrl
    competitor_urls: list[HttpUrl]

def extract_metrics(html: str, url: str) -> dict:
    """Extract quantifiable metrics from website HTML."""
    try:
        # Word count
        text_content = re.sub(r'<[^>]+>', '', html)  # Strip HTML tags
        word_count = len(text_content.split())

        # Keyword frequency (basic)
        keywords = ['tech', 'AI', 'startup', 'news']  # Example keywords
        keyword_freq = {kw: len(re.findall(rf'\b{kw}\b', text_content, re.IGNORECASE)) for kw in keywords}

        # Ad density estimation
        ad_patterns = ['ad', 'advert', 'banner', 'sponsored']
        ad_count = sum(len(re.findall(pattern, html, re.IGNORECASE)) for pattern in ad_patterns)
        ad_density = min((ad_count / max(len(html), 1)) * 100, 100)  # Percentage

        # SEO factors
        title_match = re.search(r'<title>(.*?)</title>', html, re.IGNORECASE)
        title_length = len(title_match.group(1)) if title_match else 0
        meta_desc_match = re.search(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']', html, re.IGNORECASE)
        meta_desc_length = len(meta_desc_match.group(1)) if meta_desc_match else 0

        # Engagement cues (basic)
        link_count = len(re.findall(r'<a\s+href=', html, re.IGNORECASE))
        image_count = len(re.findall(r'<img\s+src=', html, re.IGNORECASE))

        # Traffic estimates (placeholder, based on content volume)
        impressions = 1000000 if word_count > 500 else 500000
        ctr = 1.0 if ad_count > 0 else 0.5
        revenue = impressions * (ctr / 100) * 0.005  # Rough estimate
        rpm = revenue / (impressions / 1000)

        return {
            "word_count": word_count,
            "keyword_freq": keyword_freq,
            "ad_density": round(ad_density, 2),
            "ad_count": ad_count,
            "title_length": title_length,
            "meta_desc_length": meta_desc_length,
            "link_count": link_count,
            "image_count": image_count,
            "impressions": impressions,
            "ctr": ctr,
            "revenue": round(revenue, 2),
            "rpm": round(rpm, 2),
            "geography": {"US": 70, "International": 30},  # Placeholder
            "device": {"Mobile": 50, "Desktop": 50}  # Placeholder
        }
    except Exception as e:
        logger.error(f"Metric extraction failed for {url}: {e}")
        return {}

@router.post("/competitive-analysis")
async def competitive_analysis(request: CompetitiveAnalysisRequest):
    """Perform competitive analysis for a given website URL."""
    url = str(request.url)
    logger.info(f"Competitive analysis for URL: {url}")
    
    try:
        # Step 1: Fetch and analyze the input website
        if playwright_available:
            try:
                html, scripts, iframes = await fetch_rendered_html(url)
                fetch_method = "playwright"
            except Exception as playwright_error:
                logger.warning(f"Playwright failed: {playwright_error}")
                html, scripts, iframes = fetch_basic_html(url)
                fetch_method = "fallback"
        else:
            html, scripts, iframes = fetch_basic_html(url)
            fetch_method = "fallback"
        
        sanitized_html = sanitize_html(html)
        input_metrics = extract_metrics(sanitized_html, url)
        
        # Step 2: Find competitors using Exa
        domain = urlparse(url).netloc.replace('www.', '')
        query = f"site:*.{domain.split('.')[-1]} {domain.split('.')[0]} similar sites"
        exa_request = ExaQueryRequest(query=query, num_results=3)
        competitor_results = await exa_agent.publisher_content_strategy(exa_request)
        
        competitors = []
        for result in competitor_results.get("trending_content", [])[:3]:
            comp_url = result["url"]
            try:
                if playwright_available:
                    comp_html, _, _ = await fetch_rendered_html(comp_url)
                else:
                    comp_html, _, _ = fetch_basic_html(comp_url)
                comp_metrics = extract_metrics(comp_html, comp_url)
                comp_metrics["url"] = comp_url
                competitors.append(comp_metrics)
            except Exception as e:
                logger.warning(f"Failed to fetch competitor {comp_url}: {e}")
                continue
        
        # Step 3: Prepare comparative data
        comparison = {
            "input_site": {"url": url, **input_metrics},
            "competitors": competitors
        }
        
        # Step 4: Generate actionable insights with Gemini
        comparison_summary = f"""
        Input Site: {url}
        Metrics: {json.dumps(input_metrics, indent=2)}
        Competitors: {json.dumps(competitors, indent=2)}
        """
        
        insights_prompt = f"""
        Based on this competitive analysis:

        {comparison_summary}

        Provide actionable insights in JSON format:
        {{
            "competitor_strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
            "optimizations": ["actionable recommendation 1", "actionable recommendation 2", "actionable recommendation 3"]
        }}
        Focus on why competitors perform better and specific, actionable improvements for the input site.
        """
        
        insights = call_gemini(insights_prompt)
        
        # Step 5: Format visualization data
        chart_data = {
            "impressions_revenue": {
                "type": "bar",
                "title": "Impressions and Revenue Comparison",
                "labels": [url] + [c["url"] for c in competitors],
                "datasets": [
                    {
                        "label": "Impressions (monthly)",
                        "data": [input_metrics.get("impressions", 0)] + [c.get("impressions", 0) for c in competitors],
                        "backgroundColor": "#4285F4"
                    },
                    {
                        "label": "Revenue ($ monthly)",
                        "data": [input_metrics.get("revenue", 0)] + [c.get("revenue", 0) for c in competitors],
                        "backgroundColor": "#34A853"
                    }
                ]
            },
            "geography": {
                "type": "pie",
                "title": "Average Geography Breakdown",
                "labels": ["US", "International"],
                "data": [
                    sum(c.get("geography", {}).get("US", 0) for c in [input_metrics] + competitors) / (len(competitors) + 1),
                    sum(c.get("geography", {}).get("International", 0) for c in [input_metrics] + competitors) / (len(competitors) + 1)
                ],
                "backgroundColor": ["#4285F4", "#EA4335"]
            },
            "rpm_ctr": {
                "type": "bar",
                "title": "RPM and CTR Comparison",
                "labels": [url] + [c["url"] for c in competitors],
                "datasets": [
                    {
                        "label": "RPM ($)",
                        "data": [input_metrics.get("rpm", 0)] + [c.get("rpm", 0) for c in competitors],
                        "backgroundColor": "#FBBC04"
                    },
                    {
                        "label": "CTR (%)",
                        "data": [input_metrics.get("ctr", 0)] + [c.get("ctr", 0) for c in competitors],
                        "backgroundColor": "#EA4335"
                    }
                ]
            }
        }
        
        return {
            "service": "competitive_analysis",
            "url": url,
            "fetch_method": fetch_method,
            "comparison": comparison,
            "insights": insights,
            "chart_data": chart_data
        }
        
    except Exception as e:
        logger.error(f"Competitive analysis failed for {url}: {e}")
        raise HTTPException(status_code=500, detail=f"Competitive analysis failed: {str(e)}")

@router.post("/competitive-analysis-multiple")
async def competitive_analysis_multiple(request: MultiCompetitiveAnalysisRequest):
    """Perform competitive analysis between user's website and multiple competitor URLs."""
    my_website = str(request.my_website)
    competitor_urls = [str(url) for url in request.competitor_urls]
    logger.info(f"Multi-competitive analysis: {my_website} vs {competitor_urls}")
    
    try:
        fetch_method = "playwright" if playwright_available else "fallback"
        
        # Step 1: Analyze user's website
        if playwright_available:
            try:
                html, scripts, iframes = await fetch_rendered_html(my_website)
            except Exception:
                html, scripts, iframes = fetch_basic_html(my_website)
                fetch_method = "fallback"
        else:
            html, scripts, iframes = fetch_basic_html(my_website)
        
        sanitized_html = sanitize_html(html)
        my_metrics = extract_metrics(sanitized_html, my_website)
        
        # Step 2: Analyze competitor websites
        competitors = []
        for comp_url in competitor_urls:
            try:
                if playwright_available:
                    try:
                        comp_html, _, _ = await fetch_rendered_html(comp_url)
                    except Exception:
                        comp_html, _, _ = fetch_basic_html(comp_url)
                else:
                    comp_html, _, _ = fetch_basic_html(comp_url)
                    
                comp_sanitized_html = sanitize_html(comp_html)
                comp_metrics = extract_metrics(comp_sanitized_html, comp_url)
                comp_metrics["url"] = comp_url
                competitors.append(comp_metrics)
                
            except Exception as e:
                logger.warning(f"Failed to analyze competitor {comp_url}: {e}")
                # Add placeholder data for failed analysis
                competitors.append({
                    "url": comp_url,
                    "error": f"Analysis failed: {str(e)}",
                    "word_count": 0,
                    "ad_count": 0,
                    "impressions": 0,
                    "ctr": 0,
                    "revenue": 0,
                    "rpm": 0,
                    "link_count": 0,
                    "image_count": 0,
                    "geography": {"US": 0, "International": 0},
                    "device": {"Mobile": 0, "Desktop": 0}
                })
        
        # Step 3: Prepare comparative data
        comparison = {
            "input_site": {"url": my_website, **my_metrics},
            "competitors": competitors
        }
        
        # Step 4: Generate insights with Gemini
        all_sites_data = [comparison["input_site"]] + competitors
        comparison_summary = f"""
        My Website: {my_website}
        Metrics: {json.dumps(my_metrics, indent=2)}
        
        Competitors Analysis:
        {json.dumps(competitors, indent=2)}
        """
        
        insights_prompt = f"""
        Based on this multi-competitor analysis:

        {comparison_summary}

        Provide actionable insights in JSON format:
        {{
            "competitor_strengths": ["specific strength competitors have over my site", "another competitive advantage", "third key differentiator"],
            "optimizations": ["specific actionable improvement for my site", "another optimization opportunity", "third recommendation"]
        }}
        
        Focus on:
        1. Where competitors outperform my website
        2. Specific, actionable improvements I can implement
        3. Opportunities to gain competitive advantage
        """
        
        insights = call_gemini(insights_prompt)
        
        # Step 5: Create visualization data
        site_labels = [my_website] + [comp.get("url", f"Competitor {i+1}") for i, comp in enumerate(competitors)]
        
        chart_data = {
            "impressions_revenue": {
                "type": "bar",
                "title": "Traffic & Revenue Comparison",
                "labels": site_labels,
                "datasets": [
                    {
                        "label": "Monthly Impressions",
                        "data": [my_metrics.get("impressions", 0)] + [comp.get("impressions", 0) for comp in competitors],
                        "backgroundColor": "#4285F4"
                    },
                    {
                        "label": "Monthly Revenue ($)",
                        "data": [my_metrics.get("revenue", 0)] + [comp.get("revenue", 0) for comp in competitors],
                        "backgroundColor": "#34A853"
                    }
                ]
            },
            "performance_metrics": {
                "type": "radar",
                "title": "Performance Metrics Comparison",
                "labels": ["Content Volume", "Ad Density", "CTR", "RPM", "SEO Score"],
                "datasets": [
                    {
                        "label": "My Website",
                        "data": [
                            min(my_metrics.get("word_count", 0) / 1000, 100),
                            my_metrics.get("ad_density", 0),
                            my_metrics.get("ctr", 0) * 20,  # Scale for visibility
                            my_metrics.get("rpm", 0),
                            min(my_metrics.get("link_count", 0) / 10, 100)
                        ],
                        "backgroundColor": "rgba(66, 133, 244, 0.2)",
                        "borderColor": "#4285F4"
                    }
                ] + [
                    {
                        "label": f"Competitor {i+1}",
                        "data": [
                            min(comp.get("word_count", 0) / 1000, 100),
                            comp.get("ad_density", 0),
                            comp.get("ctr", 0) * 20,
                            comp.get("rpm", 0),
                            min(comp.get("link_count", 0) / 10, 100)
                        ],
                        "backgroundColor": f"rgba({52 + i*50}, {168 - i*30}, {83 + i*40}, 0.2)",
                        "borderColor": f"rgb({52 + i*50}, {168 - i*30}, {83 + i*40})"
                    } for i, comp in enumerate(competitors)
                ]
            },
            "engagement_comparison": {
                "type": "bar",
                "title": "Content & Engagement Metrics",
                "labels": site_labels,
                "datasets": [
                    {
                        "label": "Links",
                        "data": [my_metrics.get("link_count", 0)] + [comp.get("link_count", 0) for comp in competitors],
                        "backgroundColor": "#FBBC04"
                    },
                    {
                        "label": "Images", 
                        "data": [my_metrics.get("image_count", 0)] + [comp.get("image_count", 0) for comp in competitors],
                        "backgroundColor": "#EA4335"
                    }
                ]
            }
        }
        
        return {
            "service": "competitive_analysis_multiple",
            "my_website": my_website,
            "competitor_urls": competitor_urls,
            "fetch_method": fetch_method,
            "comparison": comparison,
            "insights": insights,
            "chart_data": chart_data
        }
        
    except Exception as e:
        logger.error(f"Multi-competitive analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Multi-competitive analysis failed: {str(e)}")

@router.post("/query")
async def handle_publisher_query(user_query: UserQuery):
    """Handle natural language queries for publisher metrics or website analysis."""
    query = user_query.query.lower().strip()
    
    # Check if the query contains a URL for website analysis
    url_pattern = r'https?://[^\s]+'
    urls = re.findall(url_pattern, user_query.query)
    
    if urls:
        # If URL found, perform website analysis
        try:
            url = urls[0]  # Take the first URL found
            request = URLRequest(url=url)
            result = await analyze_site(request)
            return {
                "type": "website_analysis",
                "query": user_query.query,
                "url": url,
                "analysis": result["report"]
            }
        except Exception as e:
            return {"error": f"Website analysis failed: {str(e)}"}
    
    # Direct match check for publisher metrics
    if query in publisher_metric_keys:
        result = PUBLISHER_FUNCTION_MAP[query]()
        result["chat_response"] = f"Here's your {result['metric']} data with visualization"
        result["timestamp"] = "2025-09-26T10:30:00Z"
        return {
            "type": "publisher_metric",
            "query": user_query.query,
            **result
        }
    
    # Semantic search for metric
    query_embedding = model.encode(query)
    metric_similarities = util.cos_sim(query_embedding, publisher_metric_embeddings)[0]
    max_similarity_idx = torch.argmax(metric_similarities).item()
    max_similarity = metric_similarities[max_similarity_idx].item()

    if max_similarity < 0.3:  # Threshold for minimum relevance
        return {
            "error": "No matching publisher metric found. Try asking about impressions, clicks, revenue, RPM, geography, or provide a website URL to analyze."
        }

    found_metric = publisher_metric_keys[max_similarity_idx]
    result = PUBLISHER_FUNCTION_MAP[found_metric]()
    result["chat_response"] = f"Here's your {result['metric']} data with visualization"
    result["timestamp"] = "2025-09-26T10:30:00Z"
    return {
        "type": "publisher_metric",
        "query": user_query.query,
        "matched_metric": found_metric,
        **result
    }

@router.get("/")
def publisher_info():
    """Get publisher service information."""
    return {
        "service": "publisher",
        "description": "Publisher analytics, revenue metrics, and website analysis",
        "available_metrics": list(PUBLISHER_METRICS.keys()),
        "features": {
            "analytics": "Revenue, RPM, impressions, geography data",
            "website_analysis": "Security, SEO, and ad placement analysis"
        },
        "endpoints": {
            "/query": "Natural language query endpoint (supports URLs for website analysis)",
            "/analyze": "Direct website analysis endpoint",
            "/exa-content-strategy": "AI-powered content strategy using web search",
            "/impressions": "Ad impression data",
            "/clicks": "Click data and CTR",
            "/revenue": "Revenue and earnings data",
            "/rpm": "Revenue per mille data",
            "/geography": "Geographic and device breakdown"
        }
    }