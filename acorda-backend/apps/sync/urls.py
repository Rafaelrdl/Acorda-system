"""
URL routes for sync app.
"""
from django.urls import path
from .views import (
    SyncPushView,
    SyncPullView,
    SyncFullView,
    SyncStatusView,
)

urlpatterns = [
    path('push/', SyncPushView.as_view(), name='sync-push'),
    path('pull/', SyncPullView.as_view(), name='sync-pull'),
    path('full/', SyncFullView.as_view(), name='sync-full'),
    path('status/', SyncStatusView.as_view(), name='sync-status'),
]
