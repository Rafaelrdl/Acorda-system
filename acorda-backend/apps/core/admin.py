"""
Admin configuration for core app.
"""
from django.contrib import admin
from .models import (
    Task, Goal, KeyResult, Habit, HabitLog,
    Project, InboxItem, PomodoroSession, CalendarBlock, UserSettings
)


class SyncableModelAdmin(admin.ModelAdmin):
    """Base admin for syncable models."""
    list_filter = ['user']
    search_fields = ['user__email']
    raw_id_fields = ['user']
    readonly_fields = ['id', 'created_at', 'updated_at', 'deleted_at', 'sync_version']


@admin.register(Task)
class TaskAdmin(SyncableModelAdmin):
    list_display = ['title', 'user', 'status', 'scheduled_date', 'is_top_priority']
    list_filter = ['status', 'is_top_priority', 'energy_level'] + SyncableModelAdmin.list_filter
    search_fields = ['title'] + SyncableModelAdmin.search_fields


@admin.register(Goal)
class GoalAdmin(SyncableModelAdmin):
    list_display = ['objective', 'user', 'status', 'deadline']
    list_filter = ['status'] + SyncableModelAdmin.list_filter


@admin.register(KeyResult)
class KeyResultAdmin(SyncableModelAdmin):
    list_display = ['description', 'user', 'goal_id']


@admin.register(Habit)
class HabitAdmin(SyncableModelAdmin):
    list_display = ['name', 'user', 'frequency', 'is_active']
    list_filter = ['frequency', 'is_active'] + SyncableModelAdmin.list_filter


@admin.register(HabitLog)
class HabitLogAdmin(SyncableModelAdmin):
    list_display = ['habit_id', 'user', 'date']
    list_filter = ['date'] + SyncableModelAdmin.list_filter


@admin.register(Project)
class ProjectAdmin(SyncableModelAdmin):
    list_display = ['name', 'user', 'status']
    list_filter = ['status'] + SyncableModelAdmin.list_filter


@admin.register(InboxItem)
class InboxItemAdmin(SyncableModelAdmin):
    list_display = ['content', 'user', 'item_type', 'is_processed']
    list_filter = ['item_type', 'is_processed'] + SyncableModelAdmin.list_filter


@admin.register(PomodoroSession)
class PomodoroSessionAdmin(SyncableModelAdmin):
    list_display = ['user', 'session_type', 'duration_minutes', 'started_at']
    list_filter = ['session_type'] + SyncableModelAdmin.list_filter


@admin.register(CalendarBlock)
class CalendarBlockAdmin(SyncableModelAdmin):
    list_display = ['title', 'user', 'date', 'start_time', 'end_time']
    list_filter = ['date'] + SyncableModelAdmin.list_filter


@admin.register(UserSettings)
class UserSettingsAdmin(SyncableModelAdmin):
    list_display = ['user', 'updated_at']
