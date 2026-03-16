import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import Optional
from simulation.engine import SimulationEngine, SimulationConfig
from db.database import SessionLocal, SimulationRecord
from datetime import datetime

router = APIRouter()

# In-memory store of running/completed simulations
_registry: dict = {}


class SimulationRequest(BaseModel):
    start_year:              int   = 2025
    end_year:                int   = 2125
    agi_introduction_year:   int   = 2055
    global_automation_rate:  float = 0.25
    carbon_tax_per_tonne:    float = 0.0
    renewable_energy_target: float = 0.35
    geopolitical_tension:    str   = "medium"
    scenario_name:           str   = "Baseline"
    random_seed:             int   = 42


@router.post("/run")
async def run_simulation(req: SimulationRequest, bg: BackgroundTasks):
    from api.routes.livedata import fetch_all, _cache

    config = SimulationConfig(**req.model_dump())

    # Use live-seeded engine if real data is available, else use defaults
    if _cache:
        engine = SimulationEngine.from_live_data(_cache, config)
        print(f"[Simulation] Starting with LIVE seed data")
    else:
        engine = SimulationEngine(config)
        print(f"[Simulation] Starting with FALLBACK seed data (live data not loaded)")

    sim_id = engine.simulation_id
    _registry[sim_id] = {"engine": engine, "status": "running", "snapshots": []}

    def _run_sync():
        db = SessionLocal()
        try:
            db.add(SimulationRecord(
                id=sim_id, scenario_name=req.scenario_name,
                config=req.model_dump(), status="running"
            ))
            db.commit()
            snaps = engine.run()
            _registry[sim_id]["snapshots"] = [s.__dict__ for s in snaps]
            _registry[sim_id]["status"]    = "complete"
            db.query(SimulationRecord).filter_by(id=sim_id).update(
                {"status": "complete", "completed_at": datetime.utcnow()}
            )
            db.commit()
        except Exception as e:
            print(f"[Simulation] Error: {e}")
            _registry[sim_id]["status"] = "error"
        finally:
            db.close()

    bg.add_task(_run_sync)
    return {"simulation_id": sim_id, "status": "started"}


@router.get("/status/{simulation_id}")
def get_status(simulation_id: str):
    sim = _registry.get(simulation_id)
    if not sim:
        raise HTTPException(status_code=404, detail="Simulation not found")
    engine = sim["engine"]
    return {
        "simulation_id":  simulation_id,
        "status":         sim["status"],
        "current_year":   engine.current_year,
        "progress_pct":   engine.progress_pct(),
        "snapshots_count":len(sim["snapshots"]),
    }


@router.get("/results/{simulation_id}")
def get_results(simulation_id: str):
    sim = _registry.get(simulation_id)
    if not sim:
        raise HTTPException(status_code=404, detail="Simulation not found")
    return {
        "simulation_id": simulation_id,
        "status":        sim["status"],
        "count":         len(sim["snapshots"]),
        "data":          sim["snapshots"],
    }


@router.delete("/cancel/{simulation_id}")
def cancel(simulation_id: str):
    sim = _registry.get(simulation_id)
    if not sim:
        raise HTTPException(status_code=404, detail="Not found")
    sim["engine"].stop()
    sim["status"] = "cancelled"
    return {"simulation_id": simulation_id, "status": "cancelled"}


@router.websocket("/stream")
async def stream(websocket: WebSocket):
    """Streams live simulation ticks to the frontend."""
    await websocket.accept()
    try:
        raw    = await asyncio.wait_for(websocket.receive_text(), timeout=10)
        params = json.loads(raw)
        config = SimulationConfig(**{
            k: v for k, v in params.items()
            if hasattr(SimulationConfig, k)
        })
    except Exception:
        config = SimulationConfig()

    engine = SimulationEngine(config)
    try:
        async for snap in engine.run_async():
            await websocket.send_json({
                "year":                   snap.year,
                "world_gdp":              snap.world_gdp,
                "population":             snap.population,
                "temp_anomaly":           snap.temp_anomaly,
                "automation_index":       snap.automation_index,
                "geopolitical_stability": snap.geopolitical_stability,
                "tech_progress_index":    snap.tech_progress_index,
                "renewable_share":        snap.renewable_share,
                "unemployment_rate":      snap.unemployment_rate,
                "gini_coefficient":       snap.gini_coefficient,
                "co2_ppm":                snap.co2_ppm,
                "sea_level_rise_cm":      snap.sea_level_rise_cm,
                "events":                 snap.events,
            })
            await asyncio.sleep(0.04)
        await websocket.send_json({"status": "complete"})
    except WebSocketDisconnect:
        engine.stop()