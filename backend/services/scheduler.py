import asyncio
from datetime import datetime

# How often to refresh in seconds (24 hours)
REFRESH_INTERVAL = 24 * 60 * 60
_task = None


async def _daily_refresh():
    """Background loop that re-fetches live data every 24 hours."""
    from api.routes.livedata import fetch_all, _fetched_at
    while True:
        try:
            print(f"[Scheduler] Running daily live data refresh at {datetime.utcnow().isoformat()}Z")
            await fetch_all()
        except Exception as e:
            print(f"[Scheduler] Refresh failed: {e}")
        await asyncio.sleep(REFRESH_INTERVAL)


def start():
    """Call this once at app startup to launch the background refresh loop."""
    global _task
    loop = asyncio.get_event_loop()
    _task = loop.create_task(_daily_refresh())
    print("[Scheduler] Daily live data refresh scheduled every 24 hours.")


def stop():
    """Cancel the background task on shutdown."""
    global _task
    if _task:
        _task.cancel()
        print("[Scheduler] Scheduler stopped.")