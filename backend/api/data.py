"""
Data API routes — proxy for World Bank, NASA, NOAA
Mounted at /data in main.py
"""
from fastapi import APIRouter, HTTPException, Query
from services.worldbank import (
    get_series, get_latest, get_country_profile, COUNTRY_CODES
)
from services.nasa  import get_latest_anomaly, get_temp_anomaly_series, get_location_climate
from services.noaa  import get_latest_co2, get_annual_series

router = APIRouter(prefix="/data", tags=["Real Data"])


# ── World Bank ────────────────────────────────────────────────────

@router.get("/country/{country_name}")
async def country_profile(country_name: str):
    code = COUNTRY_CODES.get(country_name)
    if not code:
        raise HTTPException(404, f"Country '{country_name}' not in WB code map")
    profile = await get_country_profile(code)
    return {
        "country": country_name,
        "code":    code,
        "data":    profile,
        "source":  "World Bank Open Data",
    }

@router.get("/indicator/{indicator}")
async def indicator_series(
    indicator: str,
    country: str = Query("WLD"),
    years:   int = Query(30, ge=1, le=60),
):
    series = await get_series(country, indicator, years)
    return {
        "indicator": indicator,
        "country":   country,
        "count":     len(series),
        "data":      series,
        "source":    "World Bank Open Data",
    }

@router.get("/world/summary")
async def world_summary():
    import asyncio
    from services.worldbank import INDICATORS
    gdp, pop, co2, renew = await asyncio.gather(
        get_latest("WLD", INDICATORS["gdp"]),
        get_latest("WLD", INDICATORS["population"]),
        get_latest("WLD", INDICATORS["co2_kt"]),
        get_latest("WLD", INDICATORS["renewable"]),
    )
    return {
        "world_gdp_t":   gdp["value"]  / 1e12 if gdp  else None,
        "world_pop_b":   pop["value"]  / 1e9  if pop  else None,
        "world_co2_kt":  co2["value"]         if co2  else None,
        "renewable_pct": renew["value"]       if renew else None,
        "source": "World Bank Open Data",
    }


# ── NASA ──────────────────────────────────────────────────────────

@router.get("/nasa/temperature")
async def nasa_temperature():
    return await get_latest_anomaly()

@router.get("/nasa/temperature/series")
async def nasa_temperature_series():
    series = await get_temp_anomaly_series()
    return {"count": len(series), "data": series, "source": "NASA GISS GISTEMP v4"}

@router.get("/nasa/climate/location")
async def nasa_location(
    lat:  float = Query(..., description="Latitude"),
    lon:  float = Query(..., description="Longitude"),
    year: int   = Query(2023),
):
    return await get_location_climate(lat, lon, year)


# ── NOAA ──────────────────────────────────────────────────────────

@router.get("/noaa/co2")
async def noaa_co2():
    return await get_latest_co2()

@router.get("/noaa/co2/series")
async def noaa_co2_series():
    series = await get_annual_series()
    return {"count": len(series), "data": series, "source": "NOAA GML Mauna Loa"}


# ── Combined vitals ───────────────────────────────────────────────

@router.get("/vitals")
async def world_vitals():
    """All world-level live vitals in one call"""
    import asyncio
    temp, co2, summary = await asyncio.gather(
        get_latest_anomaly(),
        get_latest_co2(),
        world_summary(),
    )
    return {
        "temp_anomaly": temp.get("anomaly"),
        "co2_ppm":      co2.get("ppm"),
        "world_gdp_t":  summary.get("world_gdp_t"),
        "world_pop_b":  summary.get("world_pop_b"),
        "renewable_pct":summary.get("renewable_pct"),
        "sources": {
            "temperature": temp.get("source"),
            "co2":         co2.get("source"),
            "economy":     "World Bank Open Data",
        },
    }