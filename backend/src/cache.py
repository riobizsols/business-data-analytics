import os
import threading
import time
from functools import wraps

try:
    CACHE_TTL_SECONDS = int(os.getenv("STATS_CACHE_TTL_SECONDS", "600"))
except ValueError:
    CACHE_TTL_SECONDS = 600

_lock = threading.Lock()
_store: dict = {}


def ttl_cached(key: str):
    """Cache a no-argument (apart from db) endpoint result for CACHE_TTL_SECONDS per worker."""

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if CACHE_TTL_SECONDS <= 0:
                return func(*args, **kwargs)
            now = time.monotonic()
            with _lock:
                hit = _store.get(key)
                if hit and hit[0] > now:
                    return hit[1]
            result = func(*args, **kwargs)
            with _lock:
                _store[key] = (now + CACHE_TTL_SECONDS, result)
            return result

        return wrapper

    return decorator
