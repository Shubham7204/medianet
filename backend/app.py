from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from publisher import router as publisher_router
from advertiser import router as advertiser_router

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
	return {"status": "healthy", "services": ["publisher", "advertiser"]}

@app.get("/health")
async def health():
	return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)