from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from publisher import router as publisher_router
from advertiser import router as advertiser_router
from exa_agent import exa_agent

# --- FastAPI setup ---
app = FastAPI(
	title="MediaNet API",
	description="Publisher and Advertiser Analytics API",
	version="3.0",
)

# --- CORS (adjust origins for your deployment) ---
app.add_middleware(
	CORSMiddleware,
	allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
	allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allow_headers=["*"],
)

# --- Routers ---
app.include_router(publisher_router, prefix="/publisher", tags=["Publisher"])
app.include_router(advertiser_router, prefix="/advertiser", tags=["Advertiser"])

# --- Health endpoints ---
@app.get("/")
async def health_check():
	exa_status = "available" if exa_agent.exa_client and exa_agent.gemini_model else "unavailable"
	return {
		"status": "healthy", 
		"services": ["publisher", "advertiser"], 
		"exa_agent": exa_status,
		"features": {
			"publisher": ["analytics", "website_analysis", "content_strategy"],
			"advertiser": ["analytics", "competitive_intelligence"]
		}
	}

@app.get("/health")
async def health():
	return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)