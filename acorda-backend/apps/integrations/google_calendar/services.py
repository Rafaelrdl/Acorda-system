"""
Google Calendar services — token exchange, refresh, event fetching.

All Google API communication is contained here so views stay thin.
"""
import time
import logging
from datetime import datetime, timedelta, timezone
from typing import Any

import requests
from django.conf import settings

from apps.core.models import GoogleCalendarConnection, GoogleCalendarEvent

logger = logging.getLogger(__name__)

GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
GOOGLE_REVOKE_ENDPOINT = 'https://oauth2.googleapis.com/revoke'
GOOGLE_CALENDAR_EVENTS = 'https://www.googleapis.com/calendar/v3/calendars/primary/events'


class GoogleCalendarError(Exception):
    """Domain error raised by calendar services."""


# ── Token helpers ──────────────────────────────────────────

def _client_credentials() -> tuple[str, str]:
    client_id = getattr(settings, 'GOOGLE_OAUTH_CLIENT_ID', '')
    client_secret = getattr(settings, 'GOOGLE_OAUTH_CLIENT_SECRET', '')
    if not client_id or not client_secret:
        raise GoogleCalendarError(
            'GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET não configurados no servidor.'
        )
    return client_id, client_secret


def exchange_code_for_tokens(code: str, origin: str) -> dict[str, Any]:
    """Exchange an authorization code for access + refresh tokens."""
    client_id, client_secret = _client_credentials()

    resp = requests.post(GOOGLE_TOKEN_ENDPOINT, data={
        'grant_type': 'authorization_code',
        'code': code,
        'client_id': client_id,
        'client_secret': client_secret,
        'redirect_uri': 'postmessage',  # popup mode uses origin as redirect_uri
    }, timeout=15)

    if resp.status_code != 200:
        detail = resp.json().get('error_description', resp.text[:200])
        logger.warning('Google token exchange failed: %s', detail)
        raise GoogleCalendarError(f'Falha na troca do código: {detail}')

    data = resp.json()
    return {
        'access_token': data['access_token'],
        'refresh_token': data.get('refresh_token', ''),
        'expires_in': data.get('expires_in', 3600),
    }


def refresh_access_token(connection: GoogleCalendarConnection) -> str:
    """Refresh the access token using the stored refresh token.
    
    Updates connection in-place and saves to DB.
    Returns the new access_token.
    """
    if not connection.refresh_token:
        raise GoogleCalendarError(
            'Sem refresh token. O usuário precisa reconectar o Google Calendar.'
        )

    client_id, client_secret = _client_credentials()

    resp = requests.post(GOOGLE_TOKEN_ENDPOINT, data={
        'grant_type': 'refresh_token',
        'refresh_token': connection.refresh_token,
        'client_id': client_id,
        'client_secret': client_secret,
    }, timeout=15)

    if resp.status_code != 200:
        detail = resp.json().get('error_description', resp.text[:200])
        logger.warning('Google token refresh failed for conn %s: %s', connection.id, detail)
        raise GoogleCalendarError(
            f'Falha ao atualizar token: {detail}. Reconecte o Google Calendar.'
        )

    data = resp.json()
    now_ms = int(time.time() * 1000)

    connection.access_token = data['access_token']
    connection.expires_at = now_ms + data.get('expires_in', 3600) * 1000
    connection.updated_at = now_ms
    connection.save(update_fields=['access_token', 'expires_at', 'updated_at'])

    return data['access_token']


def ensure_valid_token(connection: GoogleCalendarConnection) -> str:
    """Return a valid access token, refreshing if needed."""
    now_ms = int(time.time() * 1000)
    buffer_ms = 60_000  # 1 min buffer

    if connection.access_token and connection.expires_at and connection.expires_at > now_ms + buffer_ms:
        return connection.access_token

    return refresh_access_token(connection)


def revoke_token(connection: GoogleCalendarConnection) -> None:
    """Best-effort revocation of Google tokens."""
    token = connection.refresh_token or connection.access_token
    if not token:
        return
    try:
        requests.post(
            GOOGLE_REVOKE_ENDPOINT,
            params={'token': token},
            timeout=10,
        )
    except Exception:
        logger.info('Token revocation failed (non-fatal) for conn %s', connection.id)


# ── Event fetching & mapping ──────────────────────────────

def _now_ms() -> int:
    return int(time.time() * 1000)


def _date_key(dt: datetime) -> str:
    return dt.strftime('%Y-%m-%d')


def _normalize_event_times(event: dict) -> tuple[datetime, datetime] | None:
    """Parse Google event start/end into datetime pair (UTC)."""
    start_raw = (event.get('start') or {}).get('dateTime') or (event.get('start') or {}).get('date')
    end_raw = (event.get('end') or {}).get('dateTime') or (event.get('end') or {}).get('date')
    if not start_raw or not end_raw:
        return None

    try:
        is_all_day = 'dateTime' not in (event.get('start') or {})
        if is_all_day:
            start = datetime.fromisoformat(f'{start_raw}T00:00:00')
            end = datetime.fromisoformat(f'{end_raw}T00:00:00')
        else:
            start = datetime.fromisoformat(start_raw)
            end = datetime.fromisoformat(end_raw)
    except (ValueError, TypeError):
        return None

    # Make naive (treat as local time)
    start = start.replace(tzinfo=None)
    end = end.replace(tzinfo=None)

    if end <= start:
        return None
    return start, end


def _split_event_by_day(
    event: dict,
    user,
    start: datetime,
    end: datetime,
    synced_at: int,
) -> list[dict]:
    """Split a Google event into per-day rows."""
    import uuid as _uuid

    entries: list[dict] = []
    cursor = start

    while cursor < end:
        day_key = _date_key(cursor)
        day_start = cursor.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)

        segment_end = min(end, day_end)
        start_minutes = cursor.hour * 60 + cursor.minute
        end_minutes = segment_end.hour * 60 + segment_end.minute

        if segment_end == day_end:
            end_minutes = 24 * 60

        if end_minutes > start_minutes:
            entries.append({
                'id': _uuid.uuid4(),
                'user': user,
                'google_event_id': event['id'],
                'title': event.get('summary', 'Sem título'),
                'description': event.get('description', ''),
                'start_time': start_minutes,
                'end_time': end_minutes,
                'date': day_key,
                'is_read_only': True,
                'last_synced_at': synced_at,
                'created_at': synced_at,
                'updated_at': synced_at,
                'sync_version': synced_at,
            })

        cursor = day_end

    return entries


def fetch_and_sync_events(
    connection: GoogleCalendarConnection,
    range_days_past: int = 7,
    range_days_future: int = 60,
) -> dict[str, int]:
    """Fetch events from Google Calendar API and upsert into our DB.
    
    Returns dict with 'imported_count' and 'deleted_count'.
    """
    access_token = ensure_valid_token(connection)
    now = datetime.now()
    synced_at = _now_ms()

    time_min = (now - timedelta(days=range_days_past)).replace(hour=0, minute=0, second=0, microsecond=0)
    time_max = (now + timedelta(days=range_days_future)).replace(hour=23, minute=59, second=59, microsecond=0)

    # Fetch events (paginate via pageToken)
    all_events: list[dict] = []
    page_token: str | None = None

    while True:
        params: dict[str, str] = {
            'timeMin': time_min.astimezone(timezone.utc).isoformat(),
            'timeMax': time_max.astimezone(timezone.utc).isoformat(),
            'singleEvents': 'true',
            'orderBy': 'startTime',
            'maxResults': '2500',
            'showDeleted': 'true',
        }
        if page_token:
            params['pageToken'] = page_token

        resp = requests.get(
            GOOGLE_CALENDAR_EVENTS,
            headers={'Authorization': f'Bearer {access_token}'},
            params=params,
            timeout=20,
        )

        if resp.status_code == 401:
            # Token may have been revoked externally — try refresh once
            access_token = refresh_access_token(connection)
            resp = requests.get(
                GOOGLE_CALENDAR_EVENTS,
                headers={'Authorization': f'Bearer {access_token}'},
                params=params,
                timeout=20,
            )

        if resp.status_code != 200:
            detail = resp.text[:300]
            raise GoogleCalendarError(f'Erro ao buscar eventos do Google ({resp.status_code}): {detail}')

        data = resp.json()
        all_events.extend(data.get('items', []))
        page_token = data.get('nextPageToken')
        if not page_token:
            break

    # Separate active vs cancelled
    active_events = [e for e in all_events if e.get('status') != 'cancelled']
    cancelled_ids = {e['id'] for e in all_events if e.get('status') == 'cancelled'}

    # Soft-delete existing events for cancelled google IDs
    deleted_count = 0
    if cancelled_ids:
        qs = GoogleCalendarEvent.objects.filter(
            user=connection.user,
            google_event_id__in=cancelled_ids,
            deleted_at__isnull=True,
        )
        deleted_count += qs.count()
        qs.update(deleted_at=synced_at, updated_at=synced_at, sync_version=synced_at)

    # Collect all google_event_ids coming from active events
    active_google_ids = {e['id'] for e in active_events}

    # Soft-delete old rows for active events (will be re-created with fresh split)
    if active_google_ids:
        old_qs = GoogleCalendarEvent.objects.filter(
            user=connection.user,
            google_event_id__in=active_google_ids,
            deleted_at__isnull=True,
        )
        old_qs.update(deleted_at=synced_at, updated_at=synced_at, sync_version=synced_at)

    # Create new rows
    new_rows: list[GoogleCalendarEvent] = []
    for event in active_events:
        times = _normalize_event_times(event)
        if not times:
            continue
        start_dt, end_dt = times
        for row_data in _split_event_by_day(event, connection.user, start_dt, end_dt, synced_at):
            new_rows.append(GoogleCalendarEvent(**row_data))

    if new_rows:
        GoogleCalendarEvent.objects.bulk_create(new_rows)

    # Update connection metadata
    connection.last_sync_at = synced_at
    connection.updated_at = synced_at
    connection.sync_version = synced_at
    connection.save(update_fields=['last_sync_at', 'updated_at', 'sync_version'])

    return {
        'imported_count': len(new_rows),
        'deleted_count': deleted_count,
    }
