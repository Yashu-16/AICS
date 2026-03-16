"""
World Bank API proxy — server-side caching
Prevents frontend from hitting WB rate limits
"""
import httpx
import asyncio
from datetime import datetime, timedelta

WB_BASE  = "https://api.worldbank.org/v2"
_cache   = {}
CACHE_TTL = timedelta(hours=6)

INDICATORS = {
    "gdp":          "NY.GDP.MKTP.CD",
    "gdp_percap":   "NY.GDP.PCAP.CD",
    "gdp_growth":   "NY.GDP.MKTP.KD.ZG",
    "population":   "SP.POP.TOTL",
    "unemployment": "SL.UEM.TOTL.ZS",
    "co2_kt":       "EN.ATM.CO2E.KT",
    "renewable":    "EG.FEC.RNEW.ZS",
    "life_exp":     "SP.DYN.LE00.IN",
    "inflation":    "FP.CPI.TOTL.ZG",
    "internet":     "IT.NET.USER.ZS",
    "gini":         "SI.POV.GINI",
    "urban_pop":    "SP.URB.TOTL.IN.ZS",
    "electricity":  "EG.ELC.ACCS.ZS",
    "military":     "MS.MIL.XPND.GD.ZS",
}

COUNTRY_CODES = {
    "United States": "US", "China": "CN",      "India": "IN",
    "Japan":         "JP", "United Kingdom": "GB", "Brazil": "BR",
    "Russia":        "RU", "Canada": "CA",     "Australia": "AU",
    "South Korea":   "KR", "Mexico": "MX",     "Indonesia": "ID",
    "Nigeria":       "NG", "South Africa": "ZA","Germany": "DE",
    "France":        "FR", "Italy":   "IT",    "Saudi Arabia": "SA",
    "Argentina":     "AR", "Pakistan": "PK",   "Turkey": "TR",
    "Egypt":         "EG", "Spain":    "ES",   "Poland": "PL",
    "Ukraine":       "UA", "Colombia": "CO",   "Kenya":  "KE",
    "Vietnam":       "VN", "Malaysia": "MY",   "Netherlands": "NL",
    "Switzerland":   "CH", "Sweden":   "SE",   "Singapore": "SG",
}


async def _fetch(url: str) -> dict | None:
    if url in _cache:
        data, ts = _cache[url]
        if datetime.now() - ts < CACHE_TTL:
            return data
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(url)
            r.raise_for_status()
            json_data = r.json()
        _cache[url] = (json_data, datetime.now())
        return json_data
    except Exception as e:
        print(f"WB fetch failed {url}: {e}")
        return None


async def get_series(country_code: str, indicator: str, years: int = 30) -> list[dict]:
    url  = f"{WB_BASE}/country/{country_code}/indicator/{indicator}?format=json&mrv={years}&per_page={years}"
    data = await _fetch(url)
    if not data or len(data) < 2 or not data[1]:
        return []
    rows = [
        {"year": int(d["date"]), "value": d["value"]}
        for d in data[1]
        if d["value"] is not None
    ]
    return sorted(rows, key=lambda x: x["year"])


async def get_latest(country_code: str, indicator: str) -> dict | None:
    series = await get_series(country_code, indicator, years=5)
    return series[-1] if series else None


async def get_country_profile(country_code: str) -> dict:
    """All indicators in parallel"""
    tasks = {
        key: get_latest(country_code, ind)
        for key, ind in INDICATORS.items()
    }
    results = await asyncio.gather(*tasks.values(), return_exceptions=True)
    profile = {}
    for (key, _), result in zip(tasks.items(), results):
        if isinstance(result, dict):
            profile[key] = result
    return profile