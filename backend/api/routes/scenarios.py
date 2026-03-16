from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import uuid

router = APIRouter()

PRESETS = [
    {
        "id": "baseline",
        "name": "Baseline",
        "description": "Current trajectory, no major policy changes",
        "params": {
            "agi_introduction_year": 2055,
            "global_automation_rate": 0.25,
            "carbon_tax_per_tonne": 0,
            "geopolitical_tension": "medium"
        },
        "tags": ["reference"]
    },
    {
        "id": "high-automation",
        "name": "High Automation",
        "description": "Early AGI 2034, rapid automation, global UBI adopted",
        "params": {
            "agi_introduction_year": 2034,
            "global_automation_rate": 0.60,
            "carbon_tax_per_tonne": 80,
            "geopolitical_tension": "medium"
        },
        "tags": ["agi", "tech"]
    },
    {
        "id": "green-transition",
        "name": "Green Transition",
        "description": "$200/tonne carbon tax, 90% renewables by 2060",
        "params": {
            "agi_introduction_year": 2050,
            "global_automation_rate": 0.30,
            "carbon_tax_per_tonne": 200,
            "geopolitical_tension": "low"
        },
        "tags": ["climate"]
    },
    {
        "id": "geopolitical-fracture",
        "name": "Geopolitical Fracture",
        "description": "High tension, trade wars, slow climate action",
        "params": {
            "agi_introduction_year": 2065,
            "global_automation_rate": 0.20,
            "carbon_tax_per_tonne": 20,
            "geopolitical_tension": "critical"
        },
        "tags": ["conflict", "risk"]
    },
    {
        "id": "utopia",
        "name": "Cooperative Utopia",
        "description": "Global governance, solved climate, shared AGI",
        "params": {
            "agi_introduction_year": 2040,
            "global_automation_rate": 0.70,
            "carbon_tax_per_tonne": 250,
            "geopolitical_tension": "low"
        },
        "tags": ["optimistic"]
    },
]

_user: dict = {}


class ScenarioCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    agi_introduction_year: int = 2045
    global_automation_rate: float = 0.25
    carbon_tax_per_tonne: float = 0.0
    geopolitical_tension: str = "medium"
    tags: List[str] = []


@router.get("/list")
def list_scenarios():
    return {"scenarios": PRESETS + list(_user.values())}


@router.get("/{scenario_id}")
def get_scenario(scenario_id: str):
    for s in PRESETS:
        if s["id"] == scenario_id:
            return s
    if scenario_id in _user:
        return _user[scenario_id]
    raise HTTPException(status_code=404, detail="Scenario not found")


@router.post("/create")
def create_scenario(sc: ScenarioCreate):
    sid = str(uuid.uuid4())[:8]
    doc = {
        "id": sid,
        "name": sc.name,
        "description": sc.description,
        "params": {
            "agi_introduction_year": sc.agi_introduction_year,
            "global_automation_rate": sc.global_automation_rate,
            "carbon_tax_per_tonne": sc.carbon_tax_per_tonne,
            "geopolitical_tension": sc.geopolitical_tension,
        },
        "tags": sc.tags,
        "user_created": True,
    }
    _user[sid] = doc
    return {"scenario_id": sid, "scenario": doc}


@router.delete("/{scenario_id}")
def delete_scenario(scenario_id: str):
    if scenario_id not in _user:
        raise HTTPException(status_code=404, detail="Cannot delete preset or not found")
    del _user[scenario_id]
    return {"deleted": scenario_id}