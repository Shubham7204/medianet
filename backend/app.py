from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from publisher import router as publisher_router
from advertiser import router as advertiser_router
from ragengine import router as rag_router
from exa_agent import exa_agent
import os

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
app.include_router(rag_router, prefix="/rag", tags=["RAG Engine"])

# --- Static Files ---
# Create static directory if it doesn't exist
static_dir = os.path.join(os.getcwd(), "static")
if not os.path.exists(static_dir):
    os.makedirs(static_dir)

app.mount("/static", StaticFiles(directory="static"), name="static")

# --- Health endpoints ---
@app.get("/")
async def health_check():
	from ragengine import rag_engine
	
	exa_status = "available" if exa_agent.exa_client and exa_agent.gemini_model else "unavailable"
	rag_status = "available" if rag_engine.is_initialized else "unavailable"
	
	return {
		"status": "healthy", 
		"services": ["publisher", "advertiser", "rag"], 
		"exa_agent": exa_status,
		"rag_engine": rag_status,
		"features": {
			"publisher": ["analytics", "website_analysis", "content_strategy"],
			"advertiser": ["analytics", "competitive_intelligence", "banner_generation"],
			"rag": ["document_query", "pdf_search", "knowledge_base"]
		}
	}

@app.get("/health")
async def health():
	return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)