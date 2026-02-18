"""
Admin configuration for core app.
Complete registration of all syncable models for production operations.
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Task, Goal, KeyResult, Habit, HabitLog,
    Project, InboxItem, PomodoroSession, PomodoroPreset,
    CalendarBlock, DailyNote, UserSettings, Reference,
    GoogleCalendarConnection, GoogleCalendarEvent,
    FinanceCategory, FinanceAccount, Transaction, Income, FixedExpense, FinanceAuditLog,
    Book, ReadingLog, PDFDocument, PDFHighlight, PDFFile,
    Subject, StudySession, ConsentLog, RecordedStudySession, ReviewScheduleItem,
    WellnessProgram, WellnessCheckIn, WellnessDayAction,
    WorkoutExercise, WorkoutPlan, WorkoutPlanItem, WorkoutSession, WorkoutSetLog,
    WorkoutPlanDayStatus,
    DietMealTemplate, DietMealEntry, DataExport,
)


# ── Base Admin ───────────────────────────────────────────────

class SyncableModelAdmin(admin.ModelAdmin):
    """Base admin for all syncable models with common config."""
    list_filter: list[str] = ['user']
    search_fields: list[str] = ['user__email']
    raw_id_fields = ['user']
    readonly_fields: list[str] = ['id', 'created_at', 'updated_at', 'deleted_at', 'sync_version']
    list_per_page = 25

    def get_list_display(self, request):
        """Append soft-delete indicator to all lists."""
        display = list(super().get_list_display(request))
        if 'is_deleted' not in display:
            display.append('is_deleted')
        return display

    @admin.display(description='Deletado', boolean=True)
    def is_deleted(self, obj):
        return obj.deleted_at is not None

    actions = ['hard_delete_soft_deleted', 'restore_soft_deleted']

    @admin.action(description='Deletar permanentemente (somente soft-deleted)')
    def hard_delete_soft_deleted(self, request, queryset):
        qs = queryset.filter(deleted_at__isnull=False)
        count = qs.count()
        qs.delete()
        self.message_user(request, f'{count} registro(s) removido(s) permanentemente.')

    @admin.action(description='Restaurar soft-deleted')
    def restore_soft_deleted(self, request, queryset):
        import time
        now_ms = int(time.time() * 1000)
        count = queryset.filter(deleted_at__isnull=False).update(
            deleted_at=None, sync_version=now_ms,
        )
        self.message_user(request, f'{count} registro(s) restaurado(s).')


# ═══════════════════════════════════════════════════════════════
#  PRODUTIVIDADE
# ═══════════════════════════════════════════════════════════════

@admin.register(Task)
class TaskAdmin(SyncableModelAdmin):
    list_display = ['title', 'user', 'status_badge', 'energy_level', 'scheduled_date', 'is_top_priority']
    list_filter = ['status', 'is_top_priority', 'energy_level', 'is_two_minute_task'] + SyncableModelAdmin.list_filter
    search_fields = ['title', 'description'] + SyncableModelAdmin.search_fields

    fieldsets = (
        (None, {'fields': ('user', 'title', 'description', 'notes')}),
        ('Status', {'fields': ('status', 'client_status', 'energy_level', 'estimated_minutes')}),
        ('Agendamento', {'fields': ('scheduled_date', 'is_top_priority', 'is_two_minute_task')}),
        ('Vínculos', {'fields': ('project_id', 'key_result_id', 'tags')}),
        ('Conclusão', {'fields': ('completed_at',)}),
        ('Sync', {'fields': ('id', 'created_at', 'updated_at', 'deleted_at', 'sync_version'), 'classes': ('collapse',)}),
    )

    @admin.display(description='Status', ordering='status')
    def status_badge(self, obj):
        colors = {'todo': '#f0ad4e', 'in_progress': '#5bc0de', 'done': '#5cb85c'}
        color = colors.get(obj.status, '#777')
        return format_html(
            '<span style="background:{}; color:#fff; padding:2px 8px; border-radius:3px; font-size:11px;">{}</span>',
            color, obj.get_status_display(),
        )


class KeyResultInline(admin.TabularInline):
    model = KeyResult
    fk_name: str | None = None  # KeyResult uses goal_id UUID, not FK
    extra = 0

    def get_queryset(self, request):
        return KeyResult.objects.none()


@admin.register(Goal)
class GoalAdmin(SyncableModelAdmin):
    list_display = ['objective', 'user', 'status_badge', 'deadline']
    list_filter = ['status'] + SyncableModelAdmin.list_filter
    search_fields = ['objective', 'description'] + SyncableModelAdmin.search_fields

    fieldsets = (
        (None, {'fields': ('user', 'objective', 'description', 'deadline', 'status')}),
        ('Sync', {'fields': ('id', 'created_at', 'updated_at', 'deleted_at', 'sync_version'), 'classes': ('collapse',)}),
    )

    @admin.display(description='Status', ordering='status')
    def status_badge(self, obj):
        colors = {'active': '#5bc0de', 'completed': '#5cb85c', 'archived': '#777'}
        color = colors.get(obj.status, '#777')
        return format_html(
            '<span style="background:{}; color:#fff; padding:2px 8px; border-radius:3px; font-size:11px;">{}</span>',
            color, obj.get_status_display(),
        )


@admin.register(KeyResult)
class KeyResultAdmin(SyncableModelAdmin):
    list_display = ['description', 'user', 'goal_id', 'progress_display', 'current_value', 'target_value']
    search_fields = ['description'] + SyncableModelAdmin.search_fields

    fieldsets = (
        (None, {'fields': ('user', 'goal_id', 'description', 'unit')}),
        ('Progresso', {'fields': ('current_value', 'target_value')}),
        ('Sync', {'fields': ('id', 'created_at', 'updated_at', 'deleted_at', 'sync_version'), 'classes': ('collapse',)}),
    )

    @admin.display(description='Progresso')
    def progress_display(self, obj):
        if obj.target_value == 0:
            return '0%'
        pct = min(100, (obj.current_value / obj.target_value) * 100)
        color = '#5cb85c' if pct >= 100 else '#5bc0de' if pct >= 50 else '#f0ad4e'
        pct_str = f'{pct:.0f}'
        return format_html(
            '<div style="width:80px; background:#eee; border-radius:4px;">'
            '<div style="width:{}%; background:{}; padding:2px 6px; border-radius:4px; '
            'color:#fff; font-size:11px; text-align:center;">{}%</div></div>',
            pct_str, color, pct_str,
        )


@admin.register(Project)
class ProjectAdmin(SyncableModelAdmin):
    list_display = ['name', 'user', 'status', 'color', 'deadline']
    list_filter = ['status'] + SyncableModelAdmin.list_filter
    search_fields = ['name', 'description'] + SyncableModelAdmin.search_fields

    fieldsets = (
        (None, {'fields': ('user', 'name', 'description', 'status')}),
        ('Visual', {'fields': ('color', 'tags')}),
        ('Prazo', {'fields': ('deadline',)}),
        ('Sync', {'fields': ('id', 'created_at', 'updated_at', 'deleted_at', 'sync_version'), 'classes': ('collapse',)}),
    )


@admin.register(InboxItem)
class InboxItemAdmin(SyncableModelAdmin):
    list_display = ['content_short', 'user', 'item_type', 'is_processed']
    list_filter = ['item_type', 'is_processed'] + SyncableModelAdmin.list_filter
    search_fields = ['content'] + SyncableModelAdmin.search_fields

    fieldsets = (
        (None, {'fields': ('user', 'content', 'notes', 'item_type')}),
        ('Processamento', {'fields': ('is_processed', 'processed_at')}),
        ('Sync', {'fields': ('id', 'created_at', 'updated_at', 'deleted_at', 'sync_version'), 'classes': ('collapse',)}),
    )

    @admin.display(description='Conteúdo', ordering='content')
    def content_short(self, obj):
        return obj.content[:80] + '...' if len(obj.content) > 80 else obj.content


# ═══════════════════════════════════════════════════════════════
#  HÁBITOS
# ═══════════════════════════════════════════════════════════════

@admin.register(Habit)
class HabitAdmin(SyncableModelAdmin):
    list_display = ['name', 'user', 'frequency', 'is_active', 'color', 'icon']
    list_filter = ['frequency', 'is_active'] + SyncableModelAdmin.list_filter
    search_fields = ['name', 'description'] + SyncableModelAdmin.search_fields

    fieldsets = (
        (None, {'fields': ('user', 'name', 'description')}),
        ('Frequência', {'fields': ('frequency', 'times_per_week', 'target_days')}),
        ('Visual', {'fields': ('color', 'icon')}),
        ('Config', {'fields': ('is_active', 'minimum_version', 'key_result_id')}),
        ('Sync', {'fields': ('id', 'created_at', 'updated_at', 'deleted_at', 'sync_version'), 'classes': ('collapse',)}),
    )


@admin.register(HabitLog)
class HabitLogAdmin(SyncableModelAdmin):
    list_display = ['habit_id', 'user', 'date', 'completed_at']
    list_filter = ['date'] + SyncableModelAdmin.list_filter
    search_fields = SyncableModelAdmin.search_fields

    fieldsets = (
        (None, {'fields': ('user', 'habit_id', 'date', 'completed_at', 'notes')}),
        ('Sync', {'fields': ('id', 'created_at', 'updated_at', 'deleted_at', 'sync_version'), 'classes': ('collapse',)}),
    )


# ═══════════════════════════════════════════════════════════════
#  POMODORO / FOCO
# ═══════════════════════════════════════════════════════════════

@admin.register(PomodoroSession)
class PomodoroSessionAdmin(SyncableModelAdmin):
    list_display = ['user', 'session_type', 'duration_minutes', 'date', 'completed', 'aborted']
    list_filter = ['session_type', 'completed', 'aborted'] + SyncableModelAdmin.list_filter

    fieldsets = (
        (None, {'fields': ('user', 'session_type', 'date')}),
        ('Tempo', {'fields': ('duration_minutes', 'planned_minutes', 'actual_minutes')}),
        ('Timestamps', {'fields': ('started_at', 'ended_at')}),
        ('Status', {'fields': ('completed', 'aborted', 'interruptions_count')}),
        ('Vínculos', {'fields': ('task_id', 'preset_id', 'notes')}),
        ('Sync', {'fields': ('id', 'created_at', 'updated_at', 'deleted_at', 'sync_version'), 'classes': ('collapse',)}),
    )


@admin.register(PomodoroPreset)
class PomodoroPresetAdmin(SyncableModelAdmin):
    list_display = ['name', 'user', 'focus_duration', 'break_duration', 'long_break_duration', 'is_default']
    list_filter = ['is_default'] + SyncableModelAdmin.list_filter
    search_fields = ['name'] + SyncableModelAdmin.search_fields

    fieldsets = (
        (None, {'fields': ('user', 'name', 'is_default')}),
        ('Durações', {'fields': ('focus_duration', 'break_duration', 'long_break_duration', 'sessions_before_long_break')}),
        ('Sync', {'fields': ('id', 'created_at', 'updated_at', 'deleted_at', 'sync_version'), 'classes': ('collapse',)}),
    )


# ═══════════════════════════════════════════════════════════════
#  CALENDÁRIO / NOTAS
# ═══════════════════════════════════════════════════════════════

@admin.register(CalendarBlock)
class CalendarBlockAdmin(SyncableModelAdmin):
    list_display = ['title', 'user', 'date', 'start_time', 'end_time', 'type', 'is_recurring']
    list_filter = ['type', 'is_recurring', 'date'] + SyncableModelAdmin.list_filter
    search_fields = ['title'] + SyncableModelAdmin.search_fields

    fieldsets = (
        (None, {'fields': ('user', 'title', 'description', 'type', 'color')}),
        ('Horário', {'fields': ('date', 'start_time', 'end_time')}),
        ('Vínculos', {'fields': ('task_id', 'habit_id')}),
        ('Recorrência', {'fields': ('is_recurring', 'recurrence_pattern')}),
        ('Sync', {'fields': ('id', 'created_at', 'updated_at', 'deleted_at', 'sync_version'), 'classes': ('collapse',)}),
    )


@admin.register(DailyNote)
class DailyNoteAdmin(SyncableModelAdmin):
    list_display = ['date', 'user', 'content_short']
    search_fields = ['content', 'date'] + SyncableModelAdmin.search_fields

    fieldsets = (
        (None, {'fields': ('user', 'date', 'content')}),
        ('Sync', {'fields': ('id', 'created_at', 'updated_at', 'deleted_at', 'sync_version'), 'classes': ('collapse',)}),
    )

    @admin.display(description='Conteúdo')
    def content_short(self, obj):
        return obj.content[:100] + '...' if len(obj.content) > 100 else obj.content


@admin.register(UserSettings)
class UserSettingsAdmin(SyncableModelAdmin):
    list_display = ['user', 'updated_at']

    fieldsets = (
        (None, {'fields': ('user', 'settings_data')}),
        ('Sync', {'fields': ('id', 'created_at', 'updated_at', 'deleted_at', 'sync_version'), 'classes': ('collapse',)}),
    )


@admin.register(Reference)
class ReferenceAdmin(SyncableModelAdmin):
    list_display = ['title', 'user', 'source_url_short']
    search_fields = ['title', 'content'] + SyncableModelAdmin.search_fields

    fieldsets = (
        (None, {'fields': ('user', 'title', 'content', 'tags', 'source_url')}),
        ('Sync', {'fields': ('id', 'created_at', 'updated_at', 'deleted_at', 'sync_version'), 'classes': ('collapse',)}),
    )

    @admin.display(description='URL')
    def source_url_short(self, obj):
        if not obj.source_url:
            return '-'
        return format_html('<a href="{}" target="_blank">{}</a>', obj.source_url, obj.source_url[:40])


# ═══════════════════════════════════════════════════════════════
#  GOOGLE CALENDAR
# ═══════════════════════════════════════════════════════════════

@admin.register(GoogleCalendarConnection)
class GoogleCalendarConnectionAdmin(SyncableModelAdmin):
    list_display = ['user', 'connected', 'connected_at', 'last_sync_at']
    list_filter = ['connected'] + SyncableModelAdmin.list_filter

    fieldsets = (
        (None, {'fields': ('user', 'connected')}),
        ('Datas', {'fields': ('connected_at', 'disconnected_at', 'last_sync_at')}),
        ('Tokens (sensível)', {
            'fields': ('access_token', 'refresh_token', 'expires_at'),
            'classes': ('collapse',),
            'description': '⚠️ Dados sensíveis — não compartilhe.',
        }),
        ('Sync', {'fields': ('id', 'created_at', 'updated_at', 'deleted_at', 'sync_version'), 'classes': ('collapse',)}),
    )


@admin.register(GoogleCalendarEvent)
class GoogleCalendarEventAdmin(SyncableModelAdmin):
    list_display = ['title', 'user', 'date', 'start_time', 'end_time', 'is_read_only']
    list_filter = ['is_read_only', 'date'] + SyncableModelAdmin.list_filter
    search_fields = ['title', 'google_event_id'] + SyncableModelAdmin.search_fields

    fieldsets = (
        (None, {'fields': ('user', 'google_event_id', 'title', 'description')}),
        ('Horário', {'fields': ('date', 'start_time', 'end_time')}),
        ('Status', {'fields': ('is_read_only', 'last_synced_at')}),
        ('Sync', {'fields': ('id', 'created_at', 'updated_at', 'deleted_at', 'sync_version'), 'classes': ('collapse',)}),
    )


# ═══════════════════════════════════════════════════════════════
#  FINANÇAS
# ═══════════════════════════════════════════════════════════════

@admin.register(FinanceCategory)
class FinanceCategoryAdmin(SyncableModelAdmin):
    list_display = ['name', 'user', 'type', 'color', 'icon']
    list_filter = ['type'] + SyncableModelAdmin.list_filter
    search_fields = ['name'] + SyncableModelAdmin.search_fields

    fieldsets = (
        (None, {'fields': ('user', 'name', 'type', 'color', 'icon')}),
        ('Sync', {'fields': ('id', 'created_at', 'updated_at', 'deleted_at', 'sync_version'), 'classes': ('collapse',)}),
    )


@admin.register(FinanceAccount)
class FinanceAccountAdmin(SyncableModelAdmin):
    list_display = ['name', 'user', 'type', 'balance', 'color']
    list_filter = ['type'] + SyncableModelAdmin.list_filter
    search_fields = ['name'] + SyncableModelAdmin.search_fields

    fieldsets = (
        (None, {'fields': ('user', 'name', 'type', 'balance', 'color', 'icon')}),
        ('Sync', {'fields': ('id', 'created_at', 'updated_at', 'deleted_at', 'sync_version'), 'classes': ('collapse',)}),
    )


@admin.register(Transaction)
class TransactionAdmin(SyncableModelAdmin):
    list_display = ['description_short', 'user', 'type', 'amount', 'date', 'is_recurring', 'ai_suggested']
    list_filter = ['type', 'is_recurring', 'ai_suggested'] + SyncableModelAdmin.list_filter
    search_fields = ['description'] + SyncableModelAdmin.search_fields

    fieldsets = (
        (None, {'fields': ('user', 'type', 'amount', 'date', 'description', 'notes')}),
        ('Vínculos', {'fields': ('category_id', 'account_id', 'parent_transaction_id')}),
        ('Recorrência', {'fields': ('is_recurring',)}),
        ('IA', {'fields': ('ai_suggested', 'ai_metadata'), 'classes': ('collapse',)}),
        ('Sync', {'fields': ('id', 'created_at', 'updated_at', 'deleted_at', 'sync_version'), 'classes': ('collapse',)}),
    )

    @admin.display(description='Descrição', ordering='description')
    def description_short(self, obj):
        return obj.description[:60] + '...' if len(obj.description) > 60 else obj.description


@admin.register(Income)
class IncomeAdmin(SyncableModelAdmin):
    list_display = ['name', 'user', 'amount', 'type', 'frequency', 'is_active', 'auto_confirm']
    list_filter = ['type', 'is_active', 'auto_confirm'] + SyncableModelAdmin.list_filter
    search_fields = ['name'] + SyncableModelAdmin.search_fields

    fieldsets = (
        (None, {'fields': ('user', 'name', 'amount', 'type')}),
        ('Vínculos', {'fields': ('category_id', 'account_id')}),
        ('Recorrência', {'fields': ('frequency', 'day_of_month')}),
        ('Config', {'fields': ('is_active', 'auto_confirm', 'last_confirmed_month')}),
        ('Sync', {'fields': ('id', 'created_at', 'updated_at', 'deleted_at', 'sync_version'), 'classes': ('collapse',)}),
    )


@admin.register(FixedExpense)
class FixedExpenseAdmin(SyncableModelAdmin):
    list_display = ['name', 'user', 'amount', 'frequency', 'is_active', 'auto_confirm']
    list_filter = ['frequency', 'is_active', 'auto_confirm'] + SyncableModelAdmin.list_filter
    search_fields = ['name'] + SyncableModelAdmin.search_fields

    fieldsets = (
        (None, {'fields': ('user', 'name', 'amount')}),
        ('Vínculos', {'fields': ('category_id', 'account_id')}),
        ('Recorrência', {'fields': ('frequency', 'day_of_month')}),
        ('Config', {'fields': ('is_active', 'auto_confirm', 'last_confirmed_month')}),
        ('Sync', {'fields': ('id', 'created_at', 'updated_at', 'deleted_at', 'sync_version'), 'classes': ('collapse',)}),
    )


@admin.register(FinanceAuditLog)
class FinanceAuditLogAdmin(SyncableModelAdmin):
    list_display = ['action', 'user', 'entity_type', 'entity_id']
    list_filter = ['action', 'entity_type'] + SyncableModelAdmin.list_filter
    search_fields = ['action', 'entity_id'] + SyncableModelAdmin.search_fields
    readonly_fields = SyncableModelAdmin.readonly_fields + ['action', 'entity_type', 'entity_id', 'metadata']

    fieldsets = (
        (None, {'fields': ('user', 'action', 'entity_type', 'entity_id', 'metadata')}),
        ('Sync', {'fields': ('id', 'created_at', 'updated_at', 'deleted_at', 'sync_version'), 'classes': ('collapse',)}),
    )


# ═══════════════════════════════════════════════════════════════
#  LEITURA & PDF
# ═══════════════════════════════════════════════════════════════

@admin.register(Book)
class BookAdmin(SyncableModelAdmin):
    list_display = ['title', 'author', 'user', 'status', 'progress_display', 'start_date']
    list_filter = ['status'] + SyncableModelAdmin.list_filter
    search_fields = ['title', 'author'] + SyncableModelAdmin.search_fields

    fieldsets = (
        (None, {'fields': ('user', 'title', 'author', 'status')}),
        ('Progresso', {'fields': ('total_pages', 'current_page')}),
        ('Datas', {'fields': ('start_date', 'target_end_date')}),
        ('Notas', {'fields': ('notes',)}),
        ('Sync', {'fields': ('id', 'created_at', 'updated_at', 'deleted_at', 'sync_version'), 'classes': ('collapse',)}),
    )

    @admin.display(description='Progresso')
    def progress_display(self, obj):
        if obj.total_pages == 0:
            return '0%'
        pct = min(100, (obj.current_page / obj.total_pages) * 100)
        color = '#5cb85c' if pct >= 100 else '#5bc0de' if pct >= 50 else '#f0ad4e'
        pct_str = f'{pct:.0f}'
        return format_html(
            '<div style="width:80px; background:#eee; border-radius:4px;">'
            '<div style="width:{}%; background:{}; padding:2px 6px; border-radius:4px; '
            'color:#fff; font-size:11px; text-align:center;">{}%</div></div>',
            pct_str, color, pct_str,
        )


@admin.register(ReadingLog)
class ReadingLogAdmin(SyncableModelAdmin):
    list_display = ['book_id', 'user', 'date', 'pages_read', 'start_page', 'end_page']
    search_fields = SyncableModelAdmin.search_fields

    fieldsets = (
        (None, {'fields': ('user', 'book_id', 'date', 'pages_read', 'start_page', 'end_page', 'notes')}),
        ('Sync', {'fields': ('id', 'created_at', 'updated_at', 'deleted_at', 'sync_version'), 'classes': ('collapse',)}),
    )


@admin.register(PDFDocument)
class PDFDocumentAdmin(SyncableModelAdmin):
    list_display = ['file_name', 'user', 'total_pages', 'current_page', 'file_size_display']
    search_fields = ['file_name'] + SyncableModelAdmin.search_fields

    fieldsets = (
        (None, {'fields': ('user', 'file_name', 'file_size', 'total_pages', 'current_page', 'last_opened_at')}),
        ('Sync', {'fields': ('id', 'created_at', 'updated_at', 'deleted_at', 'sync_version'), 'classes': ('collapse',)}),
    )

    @admin.display(description='Tamanho')
    def file_size_display(self, obj):
        if obj.file_size < 1024:
            return f'{obj.file_size} B'
        elif obj.file_size < 1024 * 1024:
            return f'{obj.file_size / 1024:.1f} KB'
        return f'{obj.file_size / (1024 * 1024):.1f} MB'


@admin.register(PDFHighlight)
class PDFHighlightAdmin(SyncableModelAdmin):
    list_display = ['text_short', 'user', 'document_id', 'page_number', 'color']
    search_fields = ['text'] + SyncableModelAdmin.search_fields

    fieldsets = (
        (None, {'fields': ('user', 'document_id', 'page_number', 'text', 'color', 'note', 'position')}),
        ('Sync', {'fields': ('id', 'created_at', 'updated_at', 'deleted_at', 'sync_version'), 'classes': ('collapse',)}),
    )

    @admin.display(description='Texto')
    def text_short(self, obj):
        return obj.text[:60] + '...' if len(obj.text) > 60 else obj.text


@admin.register(PDFFile)
class PDFFileAdmin(admin.ModelAdmin):
    list_display = ['file_name', 'user', 'document_id', 'file_size_display', 'content_type', 'created_at']
    search_fields = ['file_name', 'user__email']
    raw_id_fields = ['user']
    readonly_fields = ['created_at', 'updated_at']
    list_per_page = 25

    fieldsets = (
        (None, {'fields': ('user', 'document_id', 'file', 'file_name', 'file_size', 'content_type')}),
        ('Datas', {'fields': ('created_at', 'updated_at')}),
    )

    @admin.display(description='Tamanho')
    def file_size_display(self, obj):
        if obj.file_size < 1024:
            return f'{obj.file_size} B'
        elif obj.file_size < 1024 * 1024:
            return f'{obj.file_size / 1024:.1f} KB'
        return f'{obj.file_size / (1024 * 1024):.1f} MB'


# ═══════════════════════════════════════════════════════════════
#  ESTUDOS
# ═══════════════════════════════════════════════════════════════

@admin.register(Subject)
class SubjectAdmin(SyncableModelAdmin):
    list_display = ['name', 'user', 'color', 'icon']
    search_fields = ['name'] + SyncableModelAdmin.search_fields

    fieldsets = (
        (None, {'fields': ('user', 'name', 'color', 'icon')}),
        ('Sync', {'fields': ('id', 'created_at', 'updated_at', 'deleted_at', 'sync_version'), 'classes': ('collapse',)}),
    )


@admin.register(StudySession)
class StudySessionAdmin(SyncableModelAdmin):
    list_display = ['subject_id', 'user', 'date', 'duration_minutes', 'start_time']
    search_fields = SyncableModelAdmin.search_fields

    fieldsets = (
        (None, {'fields': ('user', 'subject_id', 'date', 'duration_minutes')}),
        ('Horário', {'fields': ('start_time', 'end_time')}),
        ('Conteúdo', {'fields': ('quick_notes', 'self_test_questions')}),
        ('Sync', {'fields': ('id', 'created_at', 'updated_at', 'deleted_at', 'sync_version'), 'classes': ('collapse',)}),
    )


@admin.register(ConsentLog)
class ConsentLogAdmin(SyncableModelAdmin):
    list_display = ['consent_type', 'user', 'granted', 'timestamp', 'ip_address']
    list_filter = ['consent_type', 'granted'] + SyncableModelAdmin.list_filter
    readonly_fields = SyncableModelAdmin.readonly_fields + ['consent_type', 'granted', 'timestamp', 'ip_address']

    fieldsets = (
        (None, {'fields': ('user', 'consent_type', 'granted', 'timestamp', 'ip_address')}),
        ('Sync', {'fields': ('id', 'created_at', 'updated_at', 'deleted_at', 'sync_version'), 'classes': ('collapse',)}),
    )


@admin.register(RecordedStudySession)
class RecordedStudySessionAdmin(SyncableModelAdmin):
    list_display = ['subject_id', 'user', 'date', 'duration_minutes', 'has_transcription']
    search_fields = ['transcription'] + SyncableModelAdmin.search_fields

    fieldsets = (
        (None, {'fields': ('user', 'subject_id', 'date', 'duration_minutes', 'consent_log_id')}),
        ('Conteúdo IA', {'fields': ('transcription', 'ai_summary', 'ai_questions', 'review_schedule')}),
        ('Sync', {'fields': ('id', 'created_at', 'updated_at', 'deleted_at', 'sync_version'), 'classes': ('collapse',)}),
    )

    @admin.display(description='Transcrito', boolean=True)
    def has_transcription(self, obj):
        return bool(obj.transcription)


@admin.register(ReviewScheduleItem)
class ReviewScheduleItemAdmin(SyncableModelAdmin):
    list_display = ['recorded_session_id', 'user', 'scheduled_date', 'completed']
    list_filter = ['completed'] + SyncableModelAdmin.list_filter

    fieldsets = (
        (None, {'fields': ('user', 'recorded_session_id', 'scheduled_date', 'completed', 'completed_at', 'notes')}),
        ('Sync', {'fields': ('id', 'created_at', 'updated_at', 'deleted_at', 'sync_version'), 'classes': ('collapse',)}),
    )


# ═══════════════════════════════════════════════════════════════
#  BEM-ESTAR
# ═══════════════════════════════════════════════════════════════

@admin.register(WellnessProgram)
class WellnessProgramAdmin(SyncableModelAdmin):
    list_display = ['type', 'user', 'duration', 'start_date', 'current_day', 'is_active']
    list_filter = ['type', 'is_active'] + SyncableModelAdmin.list_filter

    fieldsets = (
        (None, {'fields': ('user', 'type', 'duration', 'start_date', 'current_day', 'is_active')}),
        ('Sync', {'fields': ('id', 'created_at', 'updated_at', 'deleted_at', 'sync_version'), 'classes': ('collapse',)}),
    )


@admin.register(WellnessCheckIn)
class WellnessCheckInAdmin(SyncableModelAdmin):
    list_display = ['date', 'user', 'sleep_hours', 'energy_level', 'mood']
    list_filter = ['energy_level', 'mood'] + SyncableModelAdmin.list_filter

    fieldsets = (
        (None, {'fields': ('user', 'date', 'sleep_hours', 'energy_level', 'mood', 'notes')}),
        ('Sync', {'fields': ('id', 'created_at', 'updated_at', 'deleted_at', 'sync_version'), 'classes': ('collapse',)}),
    )


@admin.register(WellnessDayAction)
class WellnessDayActionAdmin(SyncableModelAdmin):
    list_display = ['program_id', 'user', 'day', 'action_short', 'completed']
    list_filter = ['completed'] + SyncableModelAdmin.list_filter

    fieldsets = (
        (None, {'fields': ('user', 'program_id', 'day', 'action', 'completed', 'completed_at')}),
        ('Sync', {'fields': ('id', 'created_at', 'updated_at', 'deleted_at', 'sync_version'), 'classes': ('collapse',)}),
    )

    @admin.display(description='Ação')
    def action_short(self, obj):
        return obj.action[:60] + '...' if len(obj.action) > 60 else obj.action


# ═══════════════════════════════════════════════════════════════
#  TREINO
# ═══════════════════════════════════════════════════════════════

@admin.register(WorkoutExercise)
class WorkoutExerciseAdmin(SyncableModelAdmin):
    list_display = ['name', 'user', 'muscle_group', 'equipment']
    list_filter = ['muscle_group'] + SyncableModelAdmin.list_filter
    search_fields = ['name', 'muscle_group', 'equipment'] + SyncableModelAdmin.search_fields

    fieldsets = (
        (None, {'fields': ('user', 'name', 'muscle_group', 'equipment')}),
        ('Sync', {'fields': ('id', 'created_at', 'updated_at', 'deleted_at', 'sync_version'), 'classes': ('collapse',)}),
    )


@admin.register(WorkoutPlan)
class WorkoutPlanAdmin(SyncableModelAdmin):
    list_display = ['name', 'user', 'is_archived', 'scheduled_weekdays']
    list_filter = ['is_archived'] + SyncableModelAdmin.list_filter
    search_fields = ['name'] + SyncableModelAdmin.search_fields

    fieldsets = (
        (None, {'fields': ('user', 'name', 'notes', 'is_archived', 'scheduled_weekdays')}),
        ('Sync', {'fields': ('id', 'created_at', 'updated_at', 'deleted_at', 'sync_version'), 'classes': ('collapse',)}),
    )


@admin.register(WorkoutPlanItem)
class WorkoutPlanItemAdmin(SyncableModelAdmin):
    list_display = ['plan_id', 'exercise_id', 'user', 'order', 'target_sets']
    search_fields = SyncableModelAdmin.search_fields

    fieldsets = (
        (None, {'fields': ('user', 'plan_id', 'exercise_id', 'order')}),
        ('Alvo', {'fields': ('target_sets', 'target_reps_min', 'target_reps_max')}),
        ('Avançado', {'fields': ('prescription', 'technique'), 'classes': ('collapse',)}),
        ('Sync', {'fields': ('id', 'created_at', 'updated_at', 'deleted_at', 'sync_version'), 'classes': ('collapse',)}),
    )


@admin.register(WorkoutSession)
class WorkoutSessionAdmin(SyncableModelAdmin):
    list_display = ['plan_id', 'user', 'date', 'started_at', 'ended_at']
    search_fields = SyncableModelAdmin.search_fields

    fieldsets = (
        (None, {'fields': ('user', 'plan_id', 'date', 'notes')}),
        ('Timestamps', {'fields': ('started_at', 'ended_at')}),
        ('Sync', {'fields': ('id', 'created_at', 'updated_at', 'deleted_at', 'sync_version'), 'classes': ('collapse',)}),
    )


@admin.register(WorkoutSetLog)
class WorkoutSetLogAdmin(SyncableModelAdmin):
    list_display = ['session_id', 'exercise_id', 'user', 'set_index', 'reps', 'weight', 'unit', 'is_warmup']
    list_filter = ['is_warmup'] + SyncableModelAdmin.list_filter

    fieldsets = (
        (None, {'fields': ('user', 'session_id', 'exercise_id', 'set_index')}),
        ('Performance', {'fields': ('reps', 'weight', 'unit', 'is_warmup')}),
        ('Sync', {'fields': ('id', 'created_at', 'updated_at', 'deleted_at', 'sync_version'), 'classes': ('collapse',)}),
    )


@admin.register(WorkoutPlanDayStatus)
class WorkoutPlanDayStatusAdmin(SyncableModelAdmin):
    list_display = ['plan_id', 'user', 'date', 'resolution', 'moved_to_date']
    list_filter = ['resolution'] + SyncableModelAdmin.list_filter

    fieldsets = (
        (None, {'fields': ('user', 'plan_id', 'date', 'resolution', 'moved_to_date')}),
        ('Sync', {'fields': ('id', 'created_at', 'updated_at', 'deleted_at', 'sync_version'), 'classes': ('collapse',)}),
    )


# ═══════════════════════════════════════════════════════════════
#  DIETA
# ═══════════════════════════════════════════════════════════════

@admin.register(DietMealTemplate)
class DietMealTemplateAdmin(SyncableModelAdmin):
    list_display = ['name', 'user', 'frequency', 'default_time_minutes']
    list_filter = ['frequency'] + SyncableModelAdmin.list_filter
    search_fields = ['name'] + SyncableModelAdmin.search_fields

    fieldsets = (
        (None, {'fields': ('user', 'name', 'default_time_minutes')}),
        ('Alimentos', {'fields': ('foods',)}),
        ('Frequência', {'fields': ('frequency', 'days_of_week')}),
        ('Sync', {'fields': ('id', 'created_at', 'updated_at', 'deleted_at', 'sync_version'), 'classes': ('collapse',)}),
    )


@admin.register(DietMealEntry)
class DietMealEntryAdmin(SyncableModelAdmin):
    list_display = ['name', 'user', 'date', 'time_minutes', 'is_completed']
    list_filter = ['is_completed'] + SyncableModelAdmin.list_filter
    search_fields = ['name'] + SyncableModelAdmin.search_fields

    fieldsets = (
        (None, {'fields': ('user', 'name', 'date', 'time_minutes')}),
        ('Alimentos', {'fields': ('foods', 'notes')}),
        ('Status', {'fields': ('is_completed', 'completed_at')}),
        ('Sync', {'fields': ('id', 'created_at', 'updated_at', 'deleted_at', 'sync_version'), 'classes': ('collapse',)}),
    )


# ═══════════════════════════════════════════════════════════════
#  EXPORTAÇÃO
# ═══════════════════════════════════════════════════════════════

@admin.register(DataExport)
class DataExportAdmin(SyncableModelAdmin):
    list_display = ['export_type', 'user', 'status', 'completed_at']
    list_filter = ['export_type', 'status'] + SyncableModelAdmin.list_filter

    fieldsets = (
        (None, {'fields': ('user', 'export_type', 'status')}),
        ('Dados', {'fields': ('data', 'completed_at'), 'classes': ('collapse',)}),
        ('Sync', {'fields': ('id', 'created_at', 'updated_at', 'deleted_at', 'sync_version'), 'classes': ('collapse',)}),
    )
