"""
NOAA data proxy
- Mauna Loa CO₂ weekly and annual series
"""
import httpx
from datetime import datetime, timedelta

NOAA_BASE = "https://gml.noaa.gov/webdata/ccgg/trends/co2"
_cache    = {}
CACHE_TTL = timedelta(hours=6)


async def _fetch_text(url: str) -> str | None:
    if url in _cache:
        text, ts = _cache[url]
        if datetime.now() - ts < CACHE_TTL:
            return text
    try:
        async with httpx.AsyncClient(timeout=12) as client:
            r = await client.get(url)
            r.raise_for_status()
            text = r.text
        _cache[url] = (text, datetime.now())
        return text
    except Exception as e:
        print(f"NOAA fetch failed {url}: {e}")
        return None


async def get_latest_co2() -> dict:
    text = await _fetch_text(f"{NOAA_BASE}/co2_weekly_mlo.csv")
    if not text:
        return {"ppm": 422.1, "year": 2024, "source": "fallback"}

    lines = [l for l in text.split("\n") if not l.startswith("#") and l.strip()]
    for line in reversed(lines):
        parts = line.strip().split(",")
        if len(parts) >= 5:
            try:
                ppm = float(parts[4])
                if ppm > 0:
                    return {
                        "year":   int(parts[0]),
                        "month":  int(parts[1]),
                        "day":    int(parts[2]),
                        "ppm":    round(ppm, 2),
                        "source": "NOAA GML Mauna Loa Observatory",
                    }
            except ValueError:
                continue
    return {"ppm": 422.1, "year": 2024, "source": "fallback"}


async def get_annual_series() -> list[dict]:
    text = await _fetch_text(f"{NOAA_BASE}/co2_annmean_mlo.csv")
    if not text:
        return []
    rows = []
    for line in text.split("\n"):
        if line.startswith("#") or not line.strip():
            continue
        parts = line.strip().split(",")
        if len(parts) >= 2:
            try:
                rows.append({"year": int(parts[0]), "ppm": float(parts[1])})
            except ValueError:
                continue
    return rows