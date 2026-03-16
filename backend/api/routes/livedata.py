import httpx
import asyncio
from datetime import datetime, timedelta

# ── In-memory cache ────────────────────────────────────────────────
_cache: dict = {}
_fetched_at: datetime | None = None
CACHE_TTL_HOURS = 24


def _is_stale() -> bool:
    if _fetched_at is None:
        return True
    return datetime.utcnow() - _fetched_at > timedelta(hours=CACHE_TTL_HOURS)


# ── World Bank indicator codes ─────────────────────────────────────
WB_BASE     = "https://api.worldbank.org/v2"
IND_GDP     = "NY.GDP.MKTP.CD"    # GDP current USD
IND_POP     = "SP.POP.TOTL"       # Total population
IND_RENEW   = "EG.FEC.RNEW.ZS"   # Renewable energy %
IND_UNEMP   = "SL.UEM.TOTL.ZS"   # Unemployment %

WB_COUNTRY_MAP = {
    "US": "USA",   "CN": "China",        "IN": "India",
    "JP": "Japan", "GB": "UK",           "BR": "Brazil",
    "RU": "Russia","CA": "Canada",       "AU": "Australia",
    "KR": "South Korea", "MX": "Mexico", "ID": "Indonesia",
    "NG": "Nigeria","ZA": "South Africa","BD": "Bangladesh",
    "ET": "Ethiopia",
}

# Fallback values if APIs are unreachable
FALLBACK = {
    "world": {
        "co2_ppm":      422.6,
        "temp_anomaly": 1.20,
        "world_gdp":    105.0,
        "population":   8100,
    },
    "countries": {
        "USA":          {"gdp": 27.36, "population": 335.0, "unemployment": 3.7,  "renewable": 22.0},
        "China":        {"gdp": 17.79, "population": 1409.0,"unemployment": 5.2,  "renewable": 28.0},
        "India":        {"gdp":  3.55, "population": 1428.0,"unemployment": 7.9,  "renewable": 18.0},
        "Japan":        {"gdp":  4.21, "population":  124.5,"unemployment": 2.6,  "renewable": 21.0},
        "UK":           {"gdp":  3.09, "population":   67.7,"unemployment": 4.2,  "renewable": 42.0},
        "Brazil":       {"gdp":  2.13, "population":  215.3,"unemployment": 8.1,  "renewable": 48.0},
        "Russia":       {"gdp":  2.24, "population":  144.2,"unemployment": 3.2,  "renewable": 17.0},
        "Canada":       {"gdp":  2.14, "population":   38.2,"unemployment": 5.4,  "renewable": 66.0},
        "Australia":    {"gdp":  1.69, "population":   26.0,"unemployment": 3.7,  "renewable": 32.0},
        "South Korea":  {"gdp":  1.67, "population":   51.7,"unemployment": 2.7,  "renewable":  9.0},
        "Mexico":       {"gdp":  1.32, "population":  128.5,"unemployment": 2.8,  "renewable": 24.0},
        "Indonesia":    {"gdp":  1.32, "population":  277.5,"unemployment": 5.4,  "renewable": 14.0},
        "Nigeria":      {"gdp":  0.47, "population":  223.8,"unemployment": 4.3,  "renewable": 19.0},
        "South Africa": {"gdp":  0.40, "population":   60.4,"unemployment":32.9,  "renewable": 10.0},
        "Bangladesh":   {"gdp":  0.46, "population":  170.0,"unemployment": 5.3,  "renewable":  4.0},
        "Ethiopia":     {"gdp":  0.16, "population":  126.5,"unemployment": 3.5,  "renewable": 91.0},
    }
}


async def _wb_indicator(client: httpx.AsyncClient, indicator: str, countries: str) -> dict:
    """Fetch one World Bank indicator for a set of countries."""
    url    = f"{WB_BASE}/country/{countries}/indicator/{indicator}"
    params = {"format": "json", "mrv": 3, "per_page": 200}
    try:
        r    = await client.get(url, params=params, timeout=14)
        data = r.json()
        if not isinstance(data, list) or len(data) < 2:
            return {}
        out = {}
        for entry in (data[1] or []):
            iso = entry.get("countryiso3code", "")
            if iso in WB_COUNTRY_MAP and entry.get("value") is not None:
                name = WB_COUNTRY_MAP[iso]
                if name not in out:              # keep most-recent non-null
                    out[name] = entry["value"]
        return out
    except Exception as e:
        print(f"[LiveData] WB {indicator} failed: {e}")
        return {}


async def _fetch_co2_noaa() -> float | None:
    """Latest monthly mean CO₂ from NOAA Mauna Loa Observatory."""
    url = "https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_mm_mlo.txt"
    try:
        async with httpx.AsyncClient(timeout=12) as c:
            r     = (await c.get(url)).text.splitlines()
            lines = [l for l in r if l and not l.startswith("#")]
            for line in reversed(lines):
                parts = line.split()
                if len(parts) >= 4:
                    try:
                        val = float(parts[3])
                        if val > 0:
                            return round(val, 2)
                    except ValueError:
                        continue
    except Exception as e:
        print(f"[LiveData] NOAA CO₂ failed: {e}")
    return None


async def _fetch_temp_nasa() -> float | None:
    """Latest annual global temperature anomaly from NASA GISS."""
    url = "https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv"
    try:
        async with httpx.AsyncClient(timeout=12) as c:
            lines = (await c.get(url)).text.splitlines()
            rows  = []
            for line in lines:
                parts = line.split(",")
                if parts and parts[0].strip().isdigit():
                    rows.append(parts)
            for row in reversed(rows):
                try:
                    val = row[13].strip()
                    if val and "***" not in val:
                        return round(float(val), 3)
                except (IndexError, ValueError):
                    continue
    except Exception as e:
        print(f"[LiveData] NASA temp failed: {e}")
    return None


async def fetch_all() -> dict:
    """
    Master fetch — called at startup and every 24 hours.
    Returns a structured dict used to seed the simulation engine.
    """
    global _cache, _fetched_at

    if not _is_stale():
        print("[LiveData] Returning cached data.")
        return _cache

    print("[LiveData] Fetching live data from World Bank + NOAA + NASA...")
    codes = ";".join(WB_COUNTRY_MAP.keys())

    # Run all World Bank indicators in parallel
    async with httpx.AsyncClient(timeout=15) as client:
        gdp_r, pop_r, ren_r, une_r = await asyncio.gather(
            _wb_indicator(client, IND_GDP,   codes),
            _wb_indicator(client, IND_POP,   codes),
            _wb_indicator(client, IND_RENEW, codes),
            _wb_indicator(client, IND_UNEMP, codes),
        )

    # Run climate fetches in parallel
    co2_val, temp_val = await asyncio.gather(
        _fetch_co2_noaa(),
        _fetch_temp_nasa(),
    )

    # ── Build country data ─────────────────────────────────────────
    countries = {}
    for name, fallback in FALLBACK["countries"].items():
        gdp_usd = gdp_r.get(name)            # raw USD
        pop_raw = pop_r.get(name)
        ren_raw = ren_r.get(name)
        une_raw = une_r.get(name)

        gdp_t   = round(gdp_usd / 1e12, 3) if gdp_usd else fallback["gdp"]
        pop_m   = round(pop_raw / 1e6,  1) if pop_raw else fallback["population"]
        renew   = round(ren_raw,         1) if ren_raw else fallback["renewable"]
        unemp   = round(une_raw / 100,   4) if une_raw else round(fallback["unemployment"] / 100, 4)

        countries[name] = {
            "gdp":            gdp_t,
            "population":     pop_m,
            "renewable":      renew,
            "unemployment":   unemp,
            "source":         "worldbank" if gdp_usd else "fallback",
        }

    # ── Build world summary ────────────────────────────────────────
    world_gdp = sum(c["gdp"] for c in countries.values())
    world_pop = sum(c["population"] for c in countries.values())

    result = {
        "fetched_at":   datetime.utcnow().isoformat() + "Z",
        "next_refresh": (datetime.utcnow() + timedelta(hours=CACHE_TTL_HOURS)).isoformat() + "Z",
        "sources": {
            "gdp":        "World Bank (NY.GDP.MKTP.CD)",
            "population": "World Bank (SP.POP.TOTL)",
            "renewable":  "World Bank (EG.FEC.RNEW.ZS)",
            "co2":        "NOAA Mauna Loa Observatory",
            "temp":       "NASA GISS Surface Temperature",
        },
        "world": {
            "co2_ppm":      co2_val  or FALLBACK["world"]["co2_ppm"],
            "temp_anomaly": temp_val or FALLBACK["world"]["temp_anomaly"],
            "world_gdp":    round(world_gdp, 2),
            "population":   round(world_pop, 1),
            "co2_source":   "NOAA" if co2_val  else "fallback",
            "temp_source":  "NASA" if temp_val else "fallback",
        },
        "countries": countries,
    }

    _cache      = result
    _fetched_at = datetime.utcnow()

    # Log what we got
    co2_src  = "NOAA"     if co2_val  else "fallback"
    temp_src = "NASA"     if temp_val else "fallback"
    wb_count = len([c for c in countries.values() if c["source"] == "worldbank"])
    print(f"[LiveData] Done — CO₂: {result['world']['co2_ppm']} ppm ({co2_src}), "
          f"Temp: +{result['world']['temp_anomaly']}°C ({temp_src}), "
          f"WB countries: {wb_count}/{len(countries)}")

    return result