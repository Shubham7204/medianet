from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import logging
from typing import List, Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up logging
logger = logging.getLogger(__name__)

class QueryRequest(BaseModel):
    question: str

class QueryResponse(BaseModel):
    question: str
    answer: str
    sources: List[str] = []
    confidence: float = 0.0

class RAGEngine:
    """
    RAG (Retrieval Augmented Generation) Engine for Media.net Q&A
    Handles PDF document querying with vector similarity search and LLM generation
    """
    
    def __init__(self):
        self.vectorstore = None
        self.llm = None
        self.embeddings = None
        self.is_initialized = False
        self._initialize_rag_components()
    
    def _initialize_rag_components(self):
        """Initialize RAG components (vectorstore, LLM, embeddings)"""
        try:
            # Check for required API keys
            pinecone_key = os.getenv("PINECONE_API_KEY")
            google_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
            
            if not pinecone_key or not google_key:
                logger.warning("⚠️ RAG Engine: Missing API keys. Set PINECONE_API_KEY and GOOGLE_API_KEY in .env file")
                return
            
            # Try to import and initialize components
            self._setup_embeddings()
            self._setup_vectorstore(pinecone_key)
            self._setup_llm(google_key)
            
            if self.vectorstore and self.llm and self.embeddings:
                self.is_initialized = True
                logger.info("✅ RAG Engine initialized successfully")
            else:
                logger.warning("⚠️ RAG Engine: Some components failed to initialize")
                
        except Exception as e:
            logger.error(f"❌ RAG Engine initialization failed: {e}")
            self.is_initialized = False
    
    def _setup_embeddings(self):
        """Setup HuggingFace embeddings"""
        try:
            from langchain_community.embeddings import HuggingFaceEmbeddings
            self.embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2"
            )
            logger.info("✅ Embeddings loaded: sentence-transformers/all-MiniLM-L6-v2")
        except ImportError:
            logger.error("❌ langchain-community not installed. Run: pip install langchain-community")
        except Exception as e:
            logger.error(f"❌ Embeddings setup failed: {e}")
    
    def _setup_vectorstore(self, pinecone_key: str):
        """Setup Pinecone vectorstore"""
        try:
            from langchain_pinecone import PineconeVectorStore
            
            index_name = os.getenv("PINECONE_INDEX_NAME", "pdf-query-index")
            
            self.vectorstore = PineconeVectorStore(
                index_name=index_name,
                embedding=self.embeddings,
                pinecone_api_key=pinecone_key
            )
            logger.info(f"✅ Pinecone vectorstore connected: {index_name}")
        except ImportError:
            logger.error("❌ langchain-pinecone not installed. Run: pip install langchain-pinecone")
        except Exception as e:
            logger.error(f"❌ Vectorstore setup failed: {e}")
    
    def _setup_llm(self, google_key: str):
        """Setup Google Gemini LLM"""
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            
            model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-pro")
            
            self.llm = ChatGoogleGenerativeAI(
                model=model_name,
                temperature=0,
                google_api_key=google_key
            )
            logger.info(f"✅ Gemini LLM loaded: {model_name}")
        except ImportError:
            logger.error("❌ langchain-google-genai not installed. Run: pip install langchain-google-genai")
        except Exception as e:
            logger.error(f"❌ LLM setup failed: {e}")
    
    def _create_media_net_prompt(self, context: str, question: str) -> str:
        """Create Media.net-specific prompt"""
        return f"""
You are a MediaNet expert assistant. Answer user queries in a helpful and concise manner.

Instructions:
- Use the provided context from MediaNet documentation when available and relevant
- If the question is unrelated to MediaNet or the available context, provide a general informative answer
- Be concise but comprehensive
- Provide direct, clear answers without mentioning sources or confidence levels

Context from MediaNet Documentation:
{context}

User Question: {question}

Answer:"""
    
    async def query_documents(self, question: str) -> QueryResponse:
        """
        Query the RAG system with a question
        """
        if not self.is_initialized:
            raise HTTPException(
                status_code=503,
                detail="RAG Engine not initialized. Please check API keys and dependencies."
            )
        
        try:
            logger.info(f"Processing RAG query: {question}")
            
            # Retrieve relevant documents
            retriever = self.vectorstore.as_retriever(
                search_kwargs={"k": 3}  # Get top 3 most relevant chunks
            )
            
            retrieved_docs = retriever.get_relevant_documents(question)
            
            # Extract context and sources
            context_parts = []
            sources = []
            
            if retrieved_docs:
                for doc in retrieved_docs:
                    context_parts.append(doc.page_content)
                    # Add source metadata if available
                    source = doc.metadata.get("source", "Unknown source")
                    if source not in sources:
                        sources.append(source)
                
                context_text = "\n\n".join(context_parts)
                logger.info(f"Retrieved {len(retrieved_docs)} relevant document chunks")
            else:
                context_text = "No relevant context found in the Media.net documents."
                logger.info("No relevant documents found for the query")
            
            # Create prompt and query LLM
            prompt_text = self._create_media_net_prompt(context_text, question)
            
            # Generate response
            response = self.llm.invoke(prompt_text)
            answer = response.content if hasattr(response, 'content') else str(response)
            
            # Calculate simple confidence based on retrieved docs
            confidence = min(len(retrieved_docs) * 0.3, 1.0) if retrieved_docs else 0.1
            
            logger.info("✅ RAG query processed successfully")
            
            return QueryResponse(
                question=question,
                answer=answer,
                sources=sources,
                confidence=confidence
            )
            
        except Exception as e:
            logger.error(f"RAG query failed: {e}")
            raise HTTPException(status_code=500, detail=f"Query processing failed: {str(e)}")
    
    def get_status(self) -> Dict[str, Any]:
        """Get RAG engine status"""
        return {
            "initialized": self.is_initialized,
            "components": {
                "embeddings": self.embeddings is not None,
                "vectorstore": self.vectorstore is not None,
                "llm": self.llm is not None
            },
            "model_info": {
                "embeddings_model": "sentence-transformers/all-MiniLM-L6-v2",
                "llm_model": os.getenv("GEMINI_MODEL", "gemini-2.5-pro"),
                "index_name": os.getenv("PINECONE_INDEX_NAME", "pdf-query-index")
            }
        }

# Create singleton RAG engine instance
rag_engine = RAGEngine()

# Create FastAPI router
router = APIRouter()

@router.post("/query", response_model=QueryResponse)
async def query_media_net(req: QueryRequest):
    """
    Query the Media.net RAG system
    """
    return await rag_engine.query_documents(req.question)

@router.get("/status")
async def get_rag_status():
    """
    Get RAG engine status and configuration
    """
    return {
        "service": "rag_engine",
        "status": rag_engine.get_status(),
        "description": "Media.net RAG (Retrieval Augmented Generation) Engine",
        "endpoints": [
            {"path": "/query", "method": "POST", "description": "Query Media.net documents"},
            {"path": "/status", "method": "GET", "description": "Get RAG engine status"}
        ]
    }

@router.get("/health")
async def health_check():
    """
    Health check for RAG engine
    """
    if rag_engine.is_initialized:
        return {"status": "healthy", "rag_engine": "initialized"}
    else:
        return {"status": "unhealthy", "rag_engine": "not_initialized"}