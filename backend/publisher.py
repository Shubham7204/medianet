from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl
from typing import Dict
from sentence_transformers import SentenceTransformer, util
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
    return {"metric": "impressions", "value": 10000, "description": "How many times ads were shown"}

@router.get("/clicks")
def get_clicks() -> Dict:
    return {"metric": "clicks", "value": 500, "ctr": 0.05, "description": "How many times ads were clicked (CTR)"}

@router.get("/revenue")
def get_revenue() -> Dict:
    return {
        "metric": "revenue",
        "daily": 100.0,
        "monthly": 3000.0,
        "site_wise": {"site1": 1500.0, "site2": 1500.0},
        "description": "Revenue / Earnings (daily, monthly, site-wise)"
    }

@router.get("/rpm")
def get_rpm() -> Dict:
    return {"metric": "rpm", "value": 5.0, "ecpm": 4.8, "description": "RPM / eCPM (revenue per 1000 impressions)"}

@router.get("/geography")
def get_geography() -> Dict:
    return {
        "metric": "geography",
        "breakdown": {"US": 60, "EU": 30, "Other": 10},
        "device": {"desktop": 40, "mobile": 60},
        "description": "Geography / Device breakdown"
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
            "/impressions": "Ad impression data",
            "/clicks": "Click data and CTR",
            "/revenue": "Revenue and earnings data",
            "/rpm": "Revenue per mille data",
            "/geography": "Geographic and device breakdown"
        }
    }