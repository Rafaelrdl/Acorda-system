"""
Serializers for sync app.
"""
from rest_framework import serializers
from apps.core.models import (
    Task, Goal, KeyResult, Habit, HabitLog,
    Project, InboxItem, PomodoroSession, CalendarBlock, DailyNote, UserSettings,
    PomodoroPreset, Reference, GoogleCalendarConnection, GoogleCalendarEvent,
    FinanceCategory, FinanceAccount, Transaction, Income, FixedExpense, FinanceAuditLog,
    Book, ReadingLog, PDFDocument, PDFHighlight,
    Subject, StudySession, ConsentLog, RecordedStudySession, ReviewScheduleItem,
    WellnessProgram, WellnessCheckIn, WellnessDayAction,
    WorkoutExercise, WorkoutPlan, WorkoutPlanItem, WorkoutSession, WorkoutSetLog,
    WorkoutPlanDayStatus,
    DietMealTemplate, DietMealEntry, DataExport
)


class BaseSyncSerializer(serializers.ModelSerializer):
    """Base serializer for syncable models."""
    
    # Override id field to allow client-provided IDs (model has editable=False)
    id = serializers.UUIDField()
    
    # Expose user_id for sync - frontend needs this to filter by userId
    user_id = serializers.UUIDField(source='user.id', read_only=True)
    
    class Meta:
        fields = ['id', 'user_id', 'created_at', 'updated_at', 'deleted_at', 'sync_version']
        read_only_fields = ['sync_version', 'user_id']
        extra_kwargs = {
            'created_at': {'required': False},
            'updated_at': {'required': False},
            'deleted_at': {'required': False},
        }


class TaskSerializer(BaseSyncSerializer):
    class Meta(BaseSyncSerializer.Meta):
        model = Task
        fields = BaseSyncSerializer.Meta.fields + [
            'title', 'description', 'notes', 'status', 'client_status',
            'energy_level', 'estimated_minutes', 'tags',
            'scheduled_date', 'is_top_priority', 'is_two_minute_task',
            'project_id', 'key_result_id', 'completed_at'
        ]


class GoalSerializer(BaseSyncSerializer):
    class Meta(BaseSyncSerializer.Meta):
        model = Goal
        fields = BaseSyncSerializer.Meta.fields + [
            'objective', 'description', 'deadline', 'status'
        ]


class KeyResultSerializer(BaseSyncSerializer):
    class Meta(BaseSyncSerializer.Meta):
        model = KeyResult
        fields = BaseSyncSerializer.Meta.fields + [
            'goal_id', 'description', 'current_value', 'target_value', 'unit'
        ]


class HabitSerializer(BaseSyncSerializer):
    class Meta(BaseSyncSerializer.Meta):
        model = Habit
        fields = BaseSyncSerializer.Meta.fields + [
            'name', 'description', 'frequency', 'times_per_week', 'target_days',
            'minimum_version', 'key_result_id',
            'is_active', 'color', 'icon'
        ]


class HabitLogSerializer(BaseSyncSerializer):
    class Meta(BaseSyncSerializer.Meta):
        model = HabitLog
        fields = BaseSyncSerializer.Meta.fields + [
            'habit_id', 'date', 'completed_at', 'notes'
        ]


class ProjectSerializer(BaseSyncSerializer):
    class Meta(BaseSyncSerializer.Meta):
        model = Project
        fields = BaseSyncSerializer.Meta.fields + [
            'name', 'description', 'status', 'tags', 'color', 'deadline'
        ]


class InboxItemSerializer(BaseSyncSerializer):
    class Meta(BaseSyncSerializer.Meta):
        model = InboxItem
        fields = BaseSyncSerializer.Meta.fields + [
            'content', 'notes', 'item_type', 'is_processed', 'processed_at'
        ]


class PomodoroSessionSerializer(BaseSyncSerializer):
    class Meta(BaseSyncSerializer.Meta):
        model = PomodoroSession
        fields = BaseSyncSerializer.Meta.fields + [
            'session_type', 'duration_minutes', 'started_at', 'ended_at',
            'date', 'preset_id', 'planned_minutes', 'actual_minutes',
            'completed', 'aborted', 'interruptions_count',
            'task_id', 'notes'
        ]


class CalendarBlockSerializer(BaseSyncSerializer):
    class Meta(BaseSyncSerializer.Meta):
        model = CalendarBlock
        fields = BaseSyncSerializer.Meta.fields + [
            'title', 'description', 'date', 'start_time', 'end_time', 'type', 'color',
            'task_id', 'habit_id', 'is_recurring', 'recurrence_pattern'
        ]


class DailyNoteSerializer(BaseSyncSerializer):
    class Meta(BaseSyncSerializer.Meta):
        model = DailyNote
        fields = BaseSyncSerializer.Meta.fields + [
            'date', 'content'
        ]


class UserSettingsSerializer(BaseSyncSerializer):
    class Meta(BaseSyncSerializer.Meta):
        model = UserSettings
        fields = BaseSyncSerializer.Meta.fields + ['settings_data']


class PomodoroPresetSerializer(BaseSyncSerializer):
    class Meta(BaseSyncSerializer.Meta):
        model = PomodoroPreset
        fields = BaseSyncSerializer.Meta.fields + [
            'name', 'focus_duration', 'break_duration',
            'long_break_duration', 'sessions_before_long_break', 'is_default'
        ]


class ReferenceSerializer(BaseSyncSerializer):
    class Meta(BaseSyncSerializer.Meta):
        model = Reference
        fields = BaseSyncSerializer.Meta.fields + [
            'title', 'content', 'tags', 'source_url'
        ]


class GoogleCalendarConnectionSerializer(BaseSyncSerializer):
    class Meta(BaseSyncSerializer.Meta):
        model = GoogleCalendarConnection
        fields = BaseSyncSerializer.Meta.fields + [
            'connected', 'connected_at', 'disconnected_at',
            'last_sync_at', 'access_token', 'refresh_token', 'expires_at'
        ]


class GoogleCalendarEventSerializer(BaseSyncSerializer):
    class Meta(BaseSyncSerializer.Meta):
        model = GoogleCalendarEvent
        fields = BaseSyncSerializer.Meta.fields + [
            'google_event_id', 'title', 'description', 'start_time',
            'end_time', 'date', 'is_read_only', 'last_synced_at'
        ]


class FinanceCategorySerializer(BaseSyncSerializer):
    class Meta(BaseSyncSerializer.Meta):
        model = FinanceCategory
        fields = BaseSyncSerializer.Meta.fields + [
            'name', 'type', 'color', 'icon'
        ]


class FinanceAccountSerializer(BaseSyncSerializer):
    class Meta(BaseSyncSerializer.Meta):
        model = FinanceAccount
        fields = BaseSyncSerializer.Meta.fields + [
            'name', 'type', 'balance', 'color', 'icon'
        ]


class TransactionSerializer(BaseSyncSerializer):
    class Meta(BaseSyncSerializer.Meta):
        model = Transaction
        fields = BaseSyncSerializer.Meta.fields + [
            'type', 'amount', 'date', 'category_id', 'account_id',
            'description', 'notes', 'is_recurring', 'parent_transaction_id',
            'ai_suggested', 'ai_metadata'
        ]


class IncomeSerializer(BaseSyncSerializer):
    class Meta(BaseSyncSerializer.Meta):
        model = Income
        fields = BaseSyncSerializer.Meta.fields + [
            'name', 'amount', 'type', 'category_id', 'account_id',
            'frequency', 'day_of_month', 'is_active', 'auto_confirm', 'last_confirmed_month'
        ]


class FixedExpenseSerializer(BaseSyncSerializer):
    class Meta(BaseSyncSerializer.Meta):
        model = FixedExpense
        fields = BaseSyncSerializer.Meta.fields + [
            'name', 'amount', 'category_id', 'account_id',
            'frequency', 'day_of_month', 'is_active', 'auto_confirm', 'last_confirmed_month'
        ]


class FinanceAuditLogSerializer(BaseSyncSerializer):
    class Meta(BaseSyncSerializer.Meta):
        model = FinanceAuditLog
        fields = BaseSyncSerializer.Meta.fields + [
            'action', 'entity_type', 'entity_id', 'metadata'
        ]


class BookSerializer(BaseSyncSerializer):
    class Meta(BaseSyncSerializer.Meta):
        model = Book
        fields = BaseSyncSerializer.Meta.fields + [
            'title', 'author', 'total_pages', 'current_page',
            'start_date', 'target_end_date', 'status', 'notes'
        ]


class ReadingLogSerializer(BaseSyncSerializer):
    class Meta(BaseSyncSerializer.Meta):
        model = ReadingLog
        fields = BaseSyncSerializer.Meta.fields + [
            'book_id', 'date', 'pages_read', 'start_page', 'end_page', 'notes'
        ]


class PDFDocumentSerializer(BaseSyncSerializer):
    class Meta(BaseSyncSerializer.Meta):
        model = PDFDocument
        fields = BaseSyncSerializer.Meta.fields + [
            'file_name', 'file_size', 'total_pages', 'current_page', 'last_opened_at'
        ]


class PDFHighlightSerializer(BaseSyncSerializer):
    class Meta(BaseSyncSerializer.Meta):
        model = PDFHighlight
        fields = BaseSyncSerializer.Meta.fields + [
            'document_id', 'page_number', 'text', 'color', 'note', 'position'
        ]


class SubjectSerializer(BaseSyncSerializer):
    class Meta(BaseSyncSerializer.Meta):
        model = Subject
        fields = BaseSyncSerializer.Meta.fields + [
            'name', 'color', 'icon'
        ]


class StudySessionSerializer(BaseSyncSerializer):
    class Meta(BaseSyncSerializer.Meta):
        model = StudySession
        fields = BaseSyncSerializer.Meta.fields + [
            'subject_id', 'date', 'start_time', 'end_time',
            'duration_minutes', 'quick_notes', 'self_test_questions'
        ]


class ConsentLogSerializer(BaseSyncSerializer):
    class Meta(BaseSyncSerializer.Meta):
        model = ConsentLog
        fields = BaseSyncSerializer.Meta.fields + [
            'consent_type', 'granted', 'timestamp', 'ip_address'
        ]


class RecordedStudySessionSerializer(BaseSyncSerializer):
    class Meta(BaseSyncSerializer.Meta):
        model = RecordedStudySession
        fields = BaseSyncSerializer.Meta.fields + [
            'subject_id', 'date', 'duration_minutes', 'transcription',
            'ai_summary', 'ai_questions', 'review_schedule', 'consent_log_id'
        ]


class ReviewScheduleItemSerializer(BaseSyncSerializer):
    class Meta(BaseSyncSerializer.Meta):
        model = ReviewScheduleItem
        fields = BaseSyncSerializer.Meta.fields + [
            'recorded_session_id', 'scheduled_date', 'completed',
            'completed_at', 'notes'
        ]


class WellnessProgramSerializer(BaseSyncSerializer):
    class Meta(BaseSyncSerializer.Meta):
        model = WellnessProgram
        fields = BaseSyncSerializer.Meta.fields + [
            'type', 'duration', 'start_date', 'is_active', 'current_day'
        ]


class WellnessCheckInSerializer(BaseSyncSerializer):
    class Meta(BaseSyncSerializer.Meta):
        model = WellnessCheckIn
        fields = BaseSyncSerializer.Meta.fields + [
            'date', 'sleep_hours', 'energy_level', 'mood', 'notes'
        ]


class WellnessDayActionSerializer(BaseSyncSerializer):
    class Meta(BaseSyncSerializer.Meta):
        model = WellnessDayAction
        fields = BaseSyncSerializer.Meta.fields + [
            'program_id', 'day', 'action', 'completed', 'completed_at'
        ]


class WorkoutExerciseSerializer(BaseSyncSerializer):
    class Meta(BaseSyncSerializer.Meta):
        model = WorkoutExercise
        fields = BaseSyncSerializer.Meta.fields + [
            'name', 'muscle_group', 'equipment'
        ]


class WorkoutPlanSerializer(BaseSyncSerializer):
    class Meta(BaseSyncSerializer.Meta):
        model = WorkoutPlan
        fields = BaseSyncSerializer.Meta.fields + [
            'name', 'notes', 'is_archived', 'scheduled_weekdays'
        ]


class WorkoutPlanItemSerializer(BaseSyncSerializer):
    class Meta(BaseSyncSerializer.Meta):
        model = WorkoutPlanItem
        fields = BaseSyncSerializer.Meta.fields + [
            'plan_id', 'exercise_id', 'order',
            'target_sets', 'target_reps_min', 'target_reps_max',
            'prescription', 'technique'
        ]


class WorkoutSessionSerializer(BaseSyncSerializer):
    class Meta(BaseSyncSerializer.Meta):
        model = WorkoutSession
        fields = BaseSyncSerializer.Meta.fields + [
            'plan_id', 'date', 'started_at', 'ended_at', 'notes'
        ]


class WorkoutSetLogSerializer(BaseSyncSerializer):
    class Meta(BaseSyncSerializer.Meta):
        model = WorkoutSetLog
        fields = BaseSyncSerializer.Meta.fields + [
            'session_id', 'exercise_id', 'set_index', 'reps',
            'weight', 'unit', 'is_warmup'
        ]


class DietMealTemplateSerializer(BaseSyncSerializer):
    class Meta(BaseSyncSerializer.Meta):
        model = DietMealTemplate
        fields = BaseSyncSerializer.Meta.fields + [
            'name', 'default_time_minutes', 'foods'
        ]


class DietMealEntrySerializer(BaseSyncSerializer):
    class Meta(BaseSyncSerializer.Meta):
        model = DietMealEntry
        fields = BaseSyncSerializer.Meta.fields + [
            'date', 'name', 'time_minutes', 'foods',
            'is_completed', 'completed_at', 'notes'
        ]


class DataExportSerializer(BaseSyncSerializer):
    class Meta(BaseSyncSerializer.Meta):
        model = DataExport
        fields = BaseSyncSerializer.Meta.fields + [
            'export_type', 'status', 'data', 'completed_at'
        ]


class WorkoutPlanDayStatusSerializer(BaseSyncSerializer):
    class Meta(BaseSyncSerializer.Meta):
        model = WorkoutPlanDayStatus
        fields = BaseSyncSerializer.Meta.fields + [
            'plan_id', 'date', 'resolution', 'moved_to_date'
        ]


# Mapping of entity types to serializers
ENTITY_SERIALIZERS = {
    'tasks': TaskSerializer,
    'goals': GoalSerializer,
    'keyResults': KeyResultSerializer,
    'habits': HabitSerializer,
    'habitLogs': HabitLogSerializer,
    'projects': ProjectSerializer,
    'inboxItems': InboxItemSerializer,
    'pomodoroSessions': PomodoroSessionSerializer,
    'pomodoroPresets': PomodoroPresetSerializer,
    'calendarBlocks': CalendarBlockSerializer,
    'dailyNotes': DailyNoteSerializer,
    'userSettings': UserSettingsSerializer,
    'references': ReferenceSerializer,
    'googleCalendarConnection': GoogleCalendarConnectionSerializer,
    'googleCalendarEvents': GoogleCalendarEventSerializer,
    'financeCategories': FinanceCategorySerializer,
    'financeAccounts': FinanceAccountSerializer,
    'financeTransactions': TransactionSerializer,
    'financeIncomes': IncomeSerializer,
    'financeFixedExpenses': FixedExpenseSerializer,
    'financeAuditLogs': FinanceAuditLogSerializer,
    'books': BookSerializer,
    'readingLogs': ReadingLogSerializer,
    'pdfDocuments': PDFDocumentSerializer,
    'pdfHighlights': PDFHighlightSerializer,
    'subjects': SubjectSerializer,
    'studySessions': StudySessionSerializer,
    'consentLogs': ConsentLogSerializer,
    'recordedSessions': RecordedStudySessionSerializer,
    'reviewScheduleItems': ReviewScheduleItemSerializer,
    'wellnessPrograms': WellnessProgramSerializer,
    'wellnessCheckIns': WellnessCheckInSerializer,
    'wellnessDayActions': WellnessDayActionSerializer,
    'workoutExercises': WorkoutExerciseSerializer,
    'workoutPlans': WorkoutPlanSerializer,
    'workoutPlanItems': WorkoutPlanItemSerializer,
    'workoutSessions': WorkoutSessionSerializer,
    'workoutSetLogs': WorkoutSetLogSerializer,
    'dietMealTemplates': DietMealTemplateSerializer,
    'dietMeals': DietMealEntrySerializer,
    'dataExports': DataExportSerializer,
    'workoutPlanDayStatuses': WorkoutPlanDayStatusSerializer,
}

# Mapping of entity types to models
ENTITY_MODELS = {
    'tasks': Task,
    'goals': Goal,
    'keyResults': KeyResult,
    'habits': Habit,
    'habitLogs': HabitLog,
    'projects': Project,
    'inboxItems': InboxItem,
    'pomodoroSessions': PomodoroSession,
    'pomodoroPresets': PomodoroPreset,
    'calendarBlocks': CalendarBlock,
    'dailyNotes': DailyNote,
    'userSettings': UserSettings,
    'references': Reference,
    'googleCalendarConnection': GoogleCalendarConnection,
    'googleCalendarEvents': GoogleCalendarEvent,
    'financeCategories': FinanceCategory,
    'financeAccounts': FinanceAccount,
    'financeTransactions': Transaction,
    'financeIncomes': Income,
    'financeFixedExpenses': FixedExpense,
    'financeAuditLogs': FinanceAuditLog,
    'books': Book,
    'readingLogs': ReadingLog,
    'pdfDocuments': PDFDocument,
    'pdfHighlights': PDFHighlight,
    'subjects': Subject,
    'studySessions': StudySession,
    'consentLogs': ConsentLog,
    'recordedSessions': RecordedStudySession,
    'reviewScheduleItems': ReviewScheduleItem,
    'wellnessPrograms': WellnessProgram,
    'wellnessCheckIns': WellnessCheckIn,
    'wellnessDayActions': WellnessDayAction,
    'workoutExercises': WorkoutExercise,
    'workoutPlans': WorkoutPlan,
    'workoutPlanItems': WorkoutPlanItem,
    'workoutSessions': WorkoutSession,
    'workoutSetLogs': WorkoutSetLog,
    'dietMealTemplates': DietMealTemplate,
    'dietMeals': DietMealEntry,
    'dataExports': DataExport,
    'workoutPlanDayStatuses': WorkoutPlanDayStatus,
}


class SyncPushSerializer(serializers.Serializer):
    """Serializer for push sync request."""
    
    entity_type = serializers.ChoiceField(choices=list(ENTITY_SERIALIZERS.keys()))
    data = serializers.ListField(child=serializers.DictField())
    
    def validate(self, attrs):
        entity_type = attrs['entity_type']
        serializer_class = ENTITY_SERIALIZERS[entity_type]
        
        validated_items = []
        errors = []
        
        for i, item in enumerate(attrs['data']):
            serializer = serializer_class(data=item)
            if serializer.is_valid():
                validated_items.append(serializer.validated_data)
            else:
                errors.append({f'item_{i}': serializer.errors})
        
        if errors:
            raise serializers.ValidationError({'data': errors})
        
        attrs['validated_items'] = validated_items
        return attrs


class SyncPullSerializer(serializers.Serializer):
    """Serializer for pull sync request."""
    
    since = serializers.IntegerField(default=0, help_text='Timestamp to sync from')
    entity_types = serializers.ListField(
        child=serializers.ChoiceField(choices=list(ENTITY_SERIALIZERS.keys())),
        required=False,
        help_text='Entity types to pull (all if not specified)'
    )
