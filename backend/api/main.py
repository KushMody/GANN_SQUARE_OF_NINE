"""Main FastAPI Application Entrypoint.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers.gann_router import router as gann_router
from .routers.market_data_router import router as market_data_router
from .routers.projects_router import router as projects_router
from ..database.db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    yield
    # Shutdown


app = FastAPI(
    title="Gann Square of Nine Roadmap & Price-Time Analysis API",
    description="Professional quantitative Gann analysis platform inspired by TradingFives methodology.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration for local Next.js frontend and hosted platforms
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(gann_router)
app.include_router(market_data_router)
app.include_router(projects_router)


@app.get("/")
def health_check():
    return {
        "status": "online",
        "app": "Gann Square of Nine Roadmap Engine",
        "version": "1.0.0",
        "reference_dataset": "TradingFives 2007 S&P 500 validated"
    }
