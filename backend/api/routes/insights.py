from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import httpx
import os

router = APIRouter()


class InsightRequest(BaseModel):
    simulation_snapshot: dict
    scenario_name:       str = "Baseline"
    focus:               Optional[str] = None


@router.post("/ai")
async def get_ai_insights(request: InsightRequest):
    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not set in .env")

    snap  = request.simulation_snapshot
    focus = f"Focus specifically on: {request.focus}." if request.focus else ""

    prompt = f"""You are a senior analyst for the AI Civilization Simulator.
Analyze this simulation snapshot for scenario "{request.scenario_name}". {focus}

DATA:
- Year: {snap.get('year')} | GDP: ${snap.get('world_gdp', 0):.1f}T
- Population: {snap.get('population', 0):.0f}M
- Temp anomaly: +{snap.get('temp_anomaly', 0):.2f}°C
- Automation: {snap.get('automation_index', 0)*100:.0f}%
- Geopolitical stability: {snap.get('geopolitical_stability', 0)*100:.0f}/100
- CO₂: {snap.get('co2_ppm', 0):.0f} ppm | Unemployment: {snap.get('unemployment_rate', 0)*100:.1f}%

Respond with exactly:

**KEY TRENDS**
- [trend 1]
- [trend 2]

**CRITICAL RISKS**
- [risk 1]
- [risk 2]

**POLICY RECOMMENDATIONS**
- [rec 1]
- [rec 2]

**10-YEAR OUTLOOK**
[2-3 sentences]"""

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": "claude-sonnet-4-6",
                "max_tokens": 600,
                "messages": [{"role": "user", "content": prompt}],
            },
        )

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Claude API error: {response.text}")

    text = response.json()["content"][0]["text"]
    return {"scenario": request.scenario_name, "year": snap.get("year"), "insights": text}


@router.get("/health")
def insights_health():
    return {"claude_api_configured": bool(os.getenv("ANTHROPIC_API_KEY"))}