import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import google.generativeai as genai
from exa_py import Exa
import requests
import json
import logging
from concurrent.futures import ThreadPoolExecutor
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

# --- Setup Logging ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Securely Load Environment Variables ---
from dotenv import load_dotenv
load_dotenv()

# --- Configuration & API Key Validation ---
EXA_API_KEY = os.getenv("EXA_API_KEY", "33ee7945-6963-4ad6-bf2b-a77f864f4cd1")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyBHNgFmvdTIkbrrMf841yMUNCwTyuqK0TM")
NEWS_API_KEY = os.getenv("NEWS_API_KEY", "9745104030134db1bfdd37c8e661815d")

if not all([EXA_API_KEY, GEMINI_API_KEY, NEWS_API_KEY]):
    raise ValueError("API keys are missing. Please set EXA_API_KEY, GEMINI_API_KEY, and NEWS_API_KEY in your .env file or as environment variables.")

# --- Initialization ---
try:
    exa_client = Exa(api_key=EXA_API_KEY)
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel("gemini-2.5-flash") # Using gemini-1.5-flash
    logging.info("Successfully initialized API clients.")
except Exception as e:
    logging.error(f"Failed to initialize API clients: {e}")
    raise

# --- FastAPI App Definition ---
app = FastAPI(
    title="Marketing Strategy Generator API",
    description="An API to generate a data-driven advertising strategy using AI.",
    version="1.0.0"
)

class CampaignRequest(BaseModel):
    company_website: str
    company_name: str
    campaign_description: str
    audience_target_type: str  # e.g., "young professionals", "university students"
    city: str

# --- DYNAMIC FUNCTION WITH LIVE EXA SEARCH ---
def get_keyword_descriptions_with_sources(keywords_list: list, client: Exa):
    """
    Enriches keywords with descriptions and sources using live web searches from the Exa API.
    """
    logging.info(f"Fetching live web descriptions for {len(keywords_list)} keywords using Exa API.")

    def search_for_single_keyword(keyword_data):
        keyword = keyword_data['keyword']
        try:
            search_response = client.search_and_contents(
                f"What is the significance of the keyword '{keyword}' in digital marketing?",
                num_results=1,
                text=True
            )
            if search_response.results:
                top_result = search_response.results[0]
                keyword_data['description'] = top_result.text[:250] + '...' if top_result.text else "No text content found."
                keyword_data['source'] = top_result.url
                logging.info(f"Successfully fetched source for '{keyword}': {top_result.url}")
            else:
                keyword_data['description'] = "No description found."
                keyword_data['source'] = "N/A"
        except Exception as e:
            logging.error(f"Exa search failed for keyword '{keyword}': {e}")
            keyword_data['description'] = "Failed to fetch description."
            keyword_data['source'] = "N/A"
        return keyword_data

    with ThreadPoolExecutor(max_workers=5) as executor:
        enriched_keywords = list(executor.map(search_for_single_keyword, keywords_list))
    return enriched_keywords

# --- Advertising Metrics Functions ---
def estimate_ad_metrics(keywords: list):
    """Simulates advertising metrics for a list of keywords."""
    logging.info("Estimating advertising metrics for keywords.")
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
        else: # Generic/Other
            keyword_data['monthly_search_volume'] = np.random.randint(200, 1000)
            keyword_data['estimated_cpc'] = round(np.random.uniform(2.0, 7.0), 2)
    return keywords

def project_advertising_performance(keywords_with_metrics: list):
    """Projects advertising performance based on estimated metrics."""
    logging.info("Projecting advertising performance and revenue.")
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
        kw['projected_roas'] = round(projected_revenue / estimated_cost, 2) if estimated_cost > 0 else 0
    return keywords_with_metrics

# --- Core AI and Data Functions (Now with dynamic inputs) ---

def discover_keywords(
    company_name: str,
    campaign_description: str,
    audience_target: str,
    city: str,
    num_keywords: int = 15
):
    """Generates categorized keywords for a given domain using Gemini, tailored to the campaign."""
    logging.info(f"Generating keywords for campaign: {campaign_description}")
    prompt = f"""
    As a digital marketing expert for '{company_name}', a company with the following campaign goal: '{campaign_description}',
    generate {num_keywords} high-value keywords for a search advertising campaign.

    The campaign is specifically targeting the audience '{audience_target}' in the city of '{city}'.

    Include a mix of the following keyword categories:
    1.  **high_intent**: Keywords that signal a strong intention to purchase or sign up (e.g., 'online coding bootcamps cost').
    2.  **brand**: Keywords related to the company's name or products (e.g., '{company_name} reviews').
    3.  **awareness**: Broader keywords to attract users early in their journey (e.g., 'learn to code online').

    For each keyword, provide a concise rationale explaining why it's a good choice for this specific campaign.
    Return the response as a single, valid JSON object with the structure:
    {{"keywords": [{{"keyword": "...", "category": "...", "rationale": "..."}}]}}
    """
    try:
        response = gemini_model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        return response.text
    except Exception as e:
        logging.error(f"Gemini keyword generation failed: {e}")
        return json.dumps({"keywords": []})

def synthesize_insights(
    company_name: str,
    campaign_description: str,
    keyword_performance_data: list,
    forecast_data: dict
):
    """Generates a high-level executive summary using Gemini, tailored to the campaign."""
    logging.info("Synthesizing final executive summary with Gemini.")
    top_performers = sorted(keyword_performance_data, key=lambda x: x.get('projected_monthly_revenue', 0), reverse=True)[:3]
    prompt = f"""
    As a Chief Marketing Officer for '{company_name}', whose current campaign focus is '{campaign_description}', please analyze the provided marketing data.
    Your task is to provide a concise executive summary and actionable strategic recommendations.

    **Provided Data:**
    - Top 3 Keywords by Projected Revenue: {json.dumps(top_performers)}
    - Overall Market Revenue Forecast (Scenarios): {json.dumps(forecast_data.get('forecasts', {}))}

    **Required JSON Output Structure:**
    {{
      "executive_summary": "A high-level summary of the market opportunity based on the forecast, and how our targeted advertising strategy, focusing on top keywords, can capitalize on this.",
      "strategic_recommendations": [
        "Recommend which keyword category (high_intent, brand, awareness) to prioritize for budget allocation and explain why, using the top-performing keywords as concrete examples.",
        "Provide a clear, actionable recommendation based on the revenue forecast (e.g., 'Given the optimistic forecast, we should scale our budget by 15% in the next quarter to capture rising demand.').",
        "Suggest a specific campaign angle or ad copy idea based on the most promising keyword, which is '{top_performers[0]['keyword'] if top_performers else ''}'."
      ]
    }}
    """
    try:
        response = gemini_model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        return response.text
    except Exception as e:
        logging.error(f"Gemini insight synthesis failed: {e}")
        return json.dumps({"error": "Failed to generate AI summary."})

# --- Placeholder Functions ---
def collect_web_news(keywords: list, start_date: str, end_date: str):
    logging.info("Simulating web news collection.")
    return pd.DataFrame()

def score_sentiment(df: pd.DataFrame):
    logging.info("Simulating sentiment scoring.")
    if df.empty: return df
    df['sentiment'] = np.random.uniform(-0.5, 0.8, len(df))
    return df

def link_revenue(news_df: pd.DataFrame, revenue_df: pd.DataFrame):
    logging.info("Simulating linking revenue with sentiment.")
    revenue_df['sentiment'] = np.random.uniform(-0.2, 0.5, len(revenue_df))
    return revenue_df.set_index('date')

def train_and_forecast(df: pd.DataFrame):
    logging.info("Simulating model training and forecasting.")
    return {
        "test_mape": round(np.random.uniform(0.10, 0.25), 4),
        "forecasts": {
            "baseline": [22.5, 23.0, 23.5, 24.0, 24.5, 25.0, 25.5, 26.0, 26.5, 27.0, 27.5, 28.0],
            "optimistic": [23.0, 23.5, 24.0, 24.5, 25.0, 25.5, 26.0, 26.5, 27.0, 27.5, 28.0, 28.5],
            "pessimistic": [22.0, 22.5, 23.0, 23.5, 24.0, 24.5, 25.0, 25.5, 26.0, 26.5, 27.0, 27.5]
        }
    }

# --- Main API Endpoint ---
@app.post("/generate-marketing-strategy")
async def generate_marketing_strategy(request: CampaignRequest):
    """
    Main endpoint to generate a full, AI-driven marketing strategy.
    """
    try:
        # 1. Keyword Discovery (using request data)
        keywords_json_str = discover_keywords(
            company_name=request.company_name,
            campaign_description=request.campaign_description,
            audience_target=request.audience_target_type,
            city=request.city
        )
        keywords_list = json.loads(keywords_json_str).get("keywords", [])

        if not keywords_list:
            logging.error("No keywords were generated. Aborting pipeline.")
            raise HTTPException(status_code=500, detail="Failed to generate keywords.")

        # 1.5. Add Web-Sourced Descriptions and Sources using LIVE Exa API calls
        keywords_with_details = get_keyword_descriptions_with_sources(keywords_list, exa_client)

        # 2. Estimate Advertising Metrics
        keywords_with_metrics = estimate_ad_metrics(keywords_with_details)

        # 3. Project Advertising Performance
        keyword_performance_data = project_advertising_performance(keywords_with_metrics)

        # 4. Sentiment and Forecasting Pipeline (Simulation)
        START_DATE = (datetime.now() - timedelta(days=365*3)).strftime("%Y-%m-%d")
        END_DATE = datetime.now().strftime("%Y-%m-%d")
        date_rng = pd.date_range(start=START_DATE, end=END_DATE, freq='MS')
        historical_revenue = pd.DataFrame({'date': date_rng, 'revenue': np.random.randint(15, 30, size=len(date_rng))})

        news_data = collect_web_news(keyword_performance_data, START_DATE, END_DATE)
        sentiment_data = score_sentiment(news_data)
        merged_data = link_revenue(sentiment_data, historical_revenue)
        model_results = train_and_forecast(merged_data)

        # 5. Synthesize High-Level Insights (using request data)
        ai_summary_json_str = synthesize_insights(
            company_name=request.company_name,
            campaign_description=request.campaign_description,
            keyword_performance_data=keyword_performance_data,
            forecast_data=model_results
        )
        ai_summary = json.loads(ai_summary_json_str)

        # 6. Final JSON Output
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

        return final_output

    except Exception as e:
        logging.error(f"An error occurred in the pipeline: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Uvicorn Server Runner ---
if __name__ == '__main__':
    uvicorn.run(app, host="0.0.0.0", port=8080)