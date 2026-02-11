"""URL routing for the integrations app."""
from django.urls import path

from apps.integrations.google_calendar.views import (
    GoogleCalendarConnectView,
    GoogleCalendarDisconnectView,
    GoogleCalendarSyncView,
)

urlpatterns = [
    path('google-calendar/connect/', GoogleCalendarConnectView.as_view(), name='gcal-connect'),
    path('google-calendar/sync/', GoogleCalendarSyncView.as_view(), name='gcal-sync'),
    path('google-calendar/disconnect/', GoogleCalendarDisconnectView.as_view(), name='gcal-disconnect'),
]
