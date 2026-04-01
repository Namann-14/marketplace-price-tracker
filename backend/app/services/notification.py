"""Notification service: asyncio.Queue-based SSE broadcaster."""
import asyncio

_listeners: list[asyncio.Queue] = []


def subscribe() -> asyncio.Queue:
    """Register a new SSE client and return its dedicated queue."""
    q: asyncio.Queue = asyncio.Queue(maxsize=100)
    _listeners.append(q)
    return q


def unsubscribe(q: asyncio.Queue) -> None:
    """Remove a client's queue when the SSE connection is closed."""
    try:
        _listeners.remove(q)
    except ValueError:
        pass


async def broadcast(event_dict: dict) -> None:
    """
    Push *event_dict* to every registered listener.
    Queues that are full are silently skipped to avoid blocking.
    """
    for q in list(_listeners):
        try:
            q.put_nowait(event_dict)
        except asyncio.QueueFull:
            pass
