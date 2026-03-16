from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import uvicorn

from config import get_settings
from api.routes import simulation, scenarios, datasets, insights
from api.routes.livedata_router import router as livedata_router
from db.database import engine, Base
from services.scheduler import start as start_scheduler, stop as stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Runs at startup:
      1. Create DB tables
      2. Fetch live real-world data (World Bank, NOAA, NASA)
      3. Start daily refresh scheduler

    Runs at shutdown:
      4. Stop scheduler cleanly
    """
    # 1. DB tables
    Base.metadata.create_all(bind=engine)
    print("[Startup] Database tables ready.")

    # 2. Fetch live data immediately
    try:
        from api.routes.livedata import fetch_all
        await fetch_all()
    except Exception as e:
        print(f"[Startup] Live data fetch failed, using fallbacks: {e}")

    # 3. Start daily refresh
    start_scheduler()

    yield  # ← app runs here

    # 4. Shutdown
    stop_scheduler()
    print("[Shutdown] Clean shutdown complete.")


settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs",
    lifespan=lifespan,
)

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(simulation.router,   prefix="/api/v1/simulation", tags=["Simulation"])
app.include_router(scenarios.router,    prefix="/api/v1/scenarios",  tags=["Scenarios"])
app.include_router(datasets.router,     prefix="/api/v1/datasets",   tags=["Datasets"])
app.include_router(insights.router,     prefix="/api/v1/insights",   tags=["Insights"])
app.include_router(livedata_router,     prefix="/api/v1/livedata",   tags=["Live Data"])


@app.get("/")
def root():
    return {"app": settings.APP_NAME, "version": settings.APP_VERSION, "status": "running"}


@app.get("/health")
def health():
    from api.routes.livedata import _cache, _fetched_at
    return {
        "status":           "healthy",
        "live_data_loaded": bool(_cache),
        "live_data_age":    _fetched_at.isoformat() + "Z" if _fetched_at else None,
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)