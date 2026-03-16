from fastapi import APIRouter
from api.routes.livedata import fetch_all, _cache, _fetched_at

router = APIRouter()


@router.get("/current")
async def get_live_data():
    """Returns current real-world seeding data. Fetches if cache is stale."""
    data = await fetch_all()
    return data


@router.get("/status")
def get_status():
    """Quick check — is data loaded and from which sources?"""
    if not _cache:
        return {"loaded": False, "message": "Data not yet fetched"}
    return {
        "loaded":       True,
        "fetched_at":   _cache.get("fetched_at"),
        "next_refresh": _cache.get("next_refresh"),
        "sources":      _cache.get("sources"),
        "world":        _cache.get("world"),
        "country_count":len(_cache.get("countries", {})),
    }