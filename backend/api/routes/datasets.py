from fastapi import APIRouter

router = APIRouter()

COUNTRIES = [
    {"name":"USA",         "gdp_trillion":28.0, "population_M":340,  "tech_index":0.92, "region":"North America"},
    {"name":"China",       "gdp_trillion":18.5, "population_M":1410, "tech_index":0.85, "region":"Asia"},
    {"name":"EU",          "gdp_trillion":18.0, "population_M":450,  "tech_index":0.88, "region":"Europe"},
    {"name":"India",       "gdp_trillion":3.7,  "population_M":1440, "tech_index":0.62, "region":"Asia"},
    {"name":"Japan",       "gdp_trillion":4.2,  "population_M":124,  "tech_index":0.89, "region":"Asia"},
    {"name":"UK",          "gdp_trillion":3.1,  "population_M":67,   "tech_index":0.87, "region":"Europe"},
    {"name":"Brazil",      "gdp_trillion":2.1,  "population_M":215,  "tech_index":0.58, "region":"South America"},
    {"name":"Russia",      "gdp_trillion":2.2,  "population_M":145,  "tech_index":0.70, "region":"Europe/Asia"},
    {"name":"Nigeria",     "gdp_trillion":0.5,  "population_M":225,  "tech_index":0.32, "region":"Africa"},
    {"name":"Indonesia",   "gdp_trillion":1.3,  "population_M":275,  "tech_index":0.50, "region":"Asia"},
]


@router.get("/countries")
def get_countries():
    return {"countries": COUNTRIES, "count": len(COUNTRIES)}


@router.get("/world-indicators")
def get_world_indicators():
    return {
        "year":               2025,
        "world_gdp_trillion": 108.0,
        "population_billion": 8.1,
        "co2_ppm":            422,
        "temp_anomaly_c":     1.2,
        "sea_level_rise_cm":  22,
        "renewable_share":    0.30,
        "global_unemployment":0.055,
        "gini_world":         0.67,
    }