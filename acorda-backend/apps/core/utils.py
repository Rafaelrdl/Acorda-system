"""
Utility helpers shared across all Django apps.
"""
import logging

logger = logging.getLogger(__name__)


def safe_delay(task, *args, **kwargs):
    """
    Enqueue a Celery task via .delay(), swallowing broker connection errors
    so the calling view/signal never crashes when Redis/RabbitMQ is down.

    Falls back to running the task synchronously (task.apply) when the broker
    is unreachable.  This keeps the request flowing even if email delivery
    is deferred.
    """
    try:
        return task.delay(*args, **kwargs)
    except Exception:
        logger.exception(
            "Celery broker unavailable – executing %s synchronously",
            task.name,
        )
        try:
            return task.apply(args=args, kwargs=kwargs)
        except Exception:
            logger.exception(
                "Synchronous fallback also failed for %s",
                task.name,
            )
            return None
