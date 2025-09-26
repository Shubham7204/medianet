from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict
from sentence_transformers import SentenceTransformer, util
import torch

# Initialize router
router = APIRouter()

# Load the model at startup (shared across services)
model = SentenceTransformer('all-MiniLM-L6-v2')

class UserQuery(BaseModel):
    query: str

# Advertiser data endpoints
@router.get("/impressions")
def get_impressions() -> Dict:
    return {"metric": "impressions", "value": 20000, "description": "How many times your ad was shown"}

@router.get("/clicks")
def get_clicks() -> Dict:
    return {"metric": "clicks", "value": 1000, "ctr": 0.05, "description": "How many clicks you got (CTR)"}

@router.get("/conversions")
def get_conversions() -> Dict:
    return {"metric": "conversions", "value": 50, "description": "Sign-ups, purchases, or goals completed"}

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
    return {"metric": "spend", "value": 500.0, "description": "Total money spent"}

@router.get("/roi")
def get_roi() -> Dict:
    return {"metric": "roi", "value": 2.5, "roas": 3.0, "description": "ROI / ROAS"}

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

@router.post("/query")
async def handle_advertiser_query(user_query: UserQuery):
    """Handle natural language queries for advertiser metrics."""
    query = user_query.query.lower()
    
    # Direct match check
    if query in advertiser_metric_keys:
        return ADVERTISER_FUNCTION_MAP[query]()
    
    # Semantic search for metric
    query_embedding = model.encode(query)
    metric_similarities = util.cos_sim(query_embedding, advertiser_metric_embeddings)[0]
    max_similarity_idx = torch.argmax(metric_similarities).item()
    max_similarity = metric_similarities[max_similarity_idx].item()

    if max_similarity < 0.3:  # Threshold for minimum relevance
        return {"error": "No matching advertiser metric found. Try asking about impressions, clicks, conversions, CPC, CPM, CPA, spend, or ROI."}

    found_metric = advertiser_metric_keys[max_similarity_idx]
    return ADVERTISER_FUNCTION_MAP[found_metric]()

@router.get("/")
def advertiser_info():
    """Get advertiser service information."""
    return {
        "service": "advertiser",
        "description": "Advertiser campaign metrics and performance data",
        "available_metrics": list(ADVERTISER_METRICS.keys()),
        "endpoints": {
            "/query": "Natural language query endpoint",
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