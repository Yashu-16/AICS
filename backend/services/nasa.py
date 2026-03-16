"""
NASA data proxy
- GISS GISTEMP: global temperature anomaly
- POWER API: location-based climate
"""
import httpx
from datetime import datetime, timedelta

GISS_URL  = "https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv"
POWER_URL = "https://power.larc.nasa.gov/api/temporal/climatology/point"
_cache    = {}
CACHE_TTL = timedelta(hours=12)


async def get_temp_anomaly_series() -> list[dict]:
    if "gistemp" in _cache:
        data, ts = _cache["gistemp"]
        if datetime.now() - ts < CACHE_TTL:
            return data
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(GISS_URL)
            r.raise_for_status()
            text = r.text

        series = []
        for line in text.split("\n"):
            line = line.strip()
            if not line or not line[:4].isdigit():
                continue
            parts = line.split(",")
            if len(parts) < 14:
                continue
            try:
                year    = int(parts[0])
                ann_mean = float(parts[13])
                series.append({"year": year, "anomaly": ann_mean})
            except ValueError:
                continue

        _cache["gistemp"] = (series, datetime.now())
        return series

    except Exception as e:
        print(f"NASA GISS fetch failed: {e}")
        return []


async def get_latest_anomaly() -> dict:
    series = await get_temp_anomaly_series()
    if series:
        return {**series[-1], "source": "NASA GISS GISTEMP v4"}
    return {"year": 2024, "anomaly": 1.29, "source": "fallback"}


async def get_location_climate(lat: float, lon: float, year: int = 2023) -> dict | None:
    key = f"power_{lat}_{lon}_{year}"
    if key in _cache:
        data, ts = _cache[key]
        if datetime.now() - ts < CACHE_TTL:
            return data
    try:
        params = {
            "parameters": "T2M,PRECTOTCORR,ALLSKY_SFC_SW_DWN",
            "community":  "RE",
            "longitude":  lon,
            "latitude":   lat,
            "format":     "JSON",
            "start":      year,
            "end":        year,
        }
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(POWER_URL, params=params)
            r.raise_for_status()
            json_data = r.json()

        p      = json_data.get("properties", {}).get("parameter", {})
        T2M    = p.get("T2M", {})
        PREC   = p.get("PRECTOTCORR", {})
        SOLAR  = p.get("ALLSKY_SFC_SW_DWN", {})

        def annual_mean(d):
            vals = [v for v in list(d.values())[:12] if v and v > -900]
            return round(sum(vals) / len(vals), 2) if vals else None

        result = {
            "temp_celsius":  annual_mean(T2M),
            "precip_mm_day": annual_mean(PREC),
            "solar_kwh_m2":  annual_mean(SOLAR),
            "year":          year,
            "source":        "NASA POWER API",
        }
        _cache[key] = (result, datetime.now())
        return result

    except Exception as e:
        print(f"NASA POWER fetch failed ({lat},{lon}): {e}")
        return None