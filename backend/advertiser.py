from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict
from sentence_transformers import SentenceTransformer, util
import torch
import logging
from exa_agent import exa_agent, QueryRequest as ExaQueryRequest

# Set up logging
logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter()

# Load the model at startup (shared across services)
model = SentenceTransformer('all-MiniLM-L6-v2')

class UserQuery(BaseModel):
    query: str

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