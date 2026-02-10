"""
Tests for the sync app - validates all 42 entities and 4 sync endpoints.
"""
import time
import uuid
from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from apps.accounts.models import User
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
from .serializers import ENTITY_MODELS, ENTITY_SERIALIZERS


class TestSyncEntitiesConfiguration(TestCase):
    """Test that all 42 entities are properly configured for sync."""
    
    EXPECTED_ENTITIES = [
        'tasks',
        'goals',
        'keyResults',
        'habits',
        'habitLogs',
        'projects',
        'inboxItems',
        'pomodoroSessions',
        'pomodoroPresets',
        'calendarBlocks',
        'dailyNotes',
        'userSettings',
        'references',
        'googleCalendarConnection',
        'googleCalendarEvents',
        'financeCategories',
        'financeAccounts',
        'financeTransactions',
        'financeIncomes',
        'financeFixedExpenses',
        'financeAuditLogs',
        'books',
        'readingLogs',
        'pdfDocuments',
        'pdfHighlights',
        'subjects',
        'studySessions',
        'consentLogs',
        'recordedSessions',
        'reviewScheduleItems',
        'wellnessPrograms',
        'wellnessCheckIns',
        'wellnessDayActions',
        'workoutExercises',
        'workoutPlans',
        'workoutPlanItems',
        'workoutSessions',
        'workoutSetLogs',
        'workoutPlanDayStatuses',
        'dietMealTemplates',
        'dietMeals',
        'dataExports',
    ]
    
    def test_entity_count_is_42(self):
        """Test that exactly 42 entities are configured."""
        self.assertEqual(len(ENTITY_MODELS), 42, 
            f"Expected 42 entities, got {len(ENTITY_MODELS)}: {list(ENTITY_MODELS.keys())}")
    
    def test_all_expected_entities_have_models(self):
        """Test that all expected entities have models configured."""
        for entity in self.EXPECTED_ENTITIES:
            self.assertIn(entity, ENTITY_MODELS, 
                f"Entity '{entity}' is missing from ENTITY_MODELS")
    
    def test_all_expected_entities_have_serializers(self):
        """Test that all expected entities have serializers configured."""
        for entity in self.EXPECTED_ENTITIES:
            self.assertIn(entity, ENTITY_SERIALIZERS, 
                f"Entity '{entity}' is missing from ENTITY_SERIALIZERS")
    
    def test_entity_models_match_serializers(self):
        """Test that ENTITY_MODELS and ENTITY_SERIALIZERS have the same keys."""
        model_keys = set(ENTITY_MODELS.keys())
        serializer_keys = set(ENTITY_SERIALIZERS.keys())
        
        self.assertEqual(model_keys, serializer_keys,
            f"Mismatch: Models only: {model_keys - serializer_keys}, "
            f"Serializers only: {serializer_keys - model_keys}")


class TestSyncEndpoints(APITestCase):
    """Tests for the 4 sync endpoints."""
    
    def setUp(self):
        """Set up test client and user."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='sync-test@example.com',
            password='testpass123',
            status='active'
        )
        self.client.force_authenticate(user=self.user)
        self.now = int(time.time() * 1000)
    
    # ============ SYNC PUSH ENDPOINT ============
    
    def test_sync_push_endpoint_exists(self):
        """Test that POST /api/sync/push/ endpoint exists."""
        response = self.client.post('/api/sync/push/', {'changes': {}}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_sync_push_creates_task(self):
        """Test pushing a new task."""
        task_id = str(uuid.uuid4())
        response = self.client.post('/api/sync/push/', {
            'changes': {
                'tasks': [{
                    'id': task_id,
                    'title': 'Test Task',
                    'status': 'todo',
                    'tags': [],
                    'is_top_priority': False,
                    'is_two_minute_task': False,
                    'created_at': self.now,
                    'updated_at': self.now,
                }]
            }
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['results']['tasks']['created'], 1)
        
        # Verify task was created
        self.assertTrue(Task.objects.filter(id=task_id, user=self.user).exists())
    
    def test_sync_push_updates_task(self):
        """Test pushing an update to an existing task."""
        task_id = str(uuid.uuid4())
        # Create task first
        Task.objects.create(
            id=task_id,
            user=self.user,
            title='Original Title',
            status='todo',
            tags=[],
            is_top_priority=False,
            is_two_minute_task=False,
            created_at=self.now - 1000,
            updated_at=self.now - 1000,
        )
        
        # Push update
        response = self.client.post('/api/sync/push/', {
            'changes': {
                'tasks': [{
                    'id': task_id,
                    'title': 'Updated Title',
                    'status': 'in_progress',
                    'tags': ['important'],
                    'is_top_priority': True,
                    'is_two_minute_task': False,
                    'created_at': self.now - 1000,
                    'updated_at': self.now,
                }]
            }
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results']['tasks']['updated'], 1)
        
        # Verify update
        task = Task.objects.get(id=task_id)
        self.assertEqual(task.title, 'Updated Title')
        self.assertEqual(task.status, 'in_progress')
    
    def test_sync_push_soft_deletes_task(self):
        """Test soft-deleting a task via push."""
        task_id = str(uuid.uuid4())
        Task.objects.create(
            id=task_id,
            user=self.user,
            title='To Delete',
            status='todo',
            tags=[],
            is_top_priority=False,
            is_two_minute_task=False,
            created_at=self.now - 1000,
            updated_at=self.now - 1000,
        )
        
        response = self.client.post('/api/sync/push/', {
            'changes': {
                'tasks': [{
                    'id': task_id,
                    'title': 'To Delete',
                    'deleted_at': self.now,
                    'updated_at': self.now,
                }]
            }
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results']['tasks']['deleted'], 1)
        
        # Verify soft delete
        task = Task.objects.get(id=task_id)
        self.assertIsNotNone(task.deleted_at)
    
    def test_sync_push_requires_authentication(self):
        """Test that push requires authentication."""
        self.client.logout()
        response = self.client.post('/api/sync/push/', {'changes': {}}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    # ============ SYNC PULL ENDPOINT ============
    
    def test_sync_pull_endpoint_exists(self):
        """Test that GET /api/sync/pull/ endpoint exists."""
        response = self.client.get('/api/sync/pull/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_sync_pull_returns_all_entities(self):
        """Test that pull returns all entity types."""
        response = self.client.get('/api/sync/pull/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('changes', response.data)
        
        # Should have all 42 entity types
        self.assertEqual(len(response.data['changes']), 42)
    
    def test_sync_pull_with_since_parameter(self):
        """Test pull with since timestamp filter."""
        # Create a task
        task_id = str(uuid.uuid4())
        Task.objects.create(
            id=task_id,
            user=self.user,
            title='Recent Task',
            status='inbox',
            tags=[],
            is_top_priority=False,
            is_two_minute_task=False,
            created_at=self.now,
            updated_at=self.now,
            sync_version=self.now,
        )
        
        # Pull with since = 0 should include the task
        response = self.client.get('/api/sync/pull/?since=0')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['changes']['tasks']), 1)
        
        # Pull with since = now + 1000 should not include it
        response = self.client.get(f'/api/sync/pull/?since={self.now + 1000}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['changes']['tasks']), 0)
    
    def test_sync_pull_with_entities_filter(self):
        """Test pull with specific entities filter."""
        response = self.client.get('/api/sync/pull/?entities=tasks,habits')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tasks', response.data['changes'])
        self.assertIn('habits', response.data['changes'])
        # Should only have 2 entity types
        self.assertEqual(len(response.data['changes']), 2)
    
    def test_sync_pull_requires_authentication(self):
        """Test that pull requires authentication."""
        self.client.logout()
        response = self.client.get('/api/sync/pull/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    # ============ SYNC FULL ENDPOINT ============
    
    def test_sync_full_endpoint_exists(self):
        """Test that GET /api/sync/full/ endpoint exists."""
        response = self.client.get('/api/sync/full/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_sync_full_returns_all_entities(self):
        """Test that full sync returns all entity types."""
        response = self.client.get('/api/sync/full/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('data', response.data)
        
        # Should have all 42 entity types
        self.assertEqual(len(response.data['data']), 42)
    
    def test_sync_full_excludes_deleted_items(self):
        """Test that full sync excludes soft-deleted items."""
        # Create active task
        active_id = str(uuid.uuid4())
        Task.objects.create(
            id=active_id,
            user=self.user,
            title='Active Task',
            status='inbox',
            tags=[],
            is_top_priority=False,
            is_two_minute_task=False,
            created_at=self.now,
            updated_at=self.now,
        )
        
        # Create deleted task
        deleted_id = str(uuid.uuid4())
        Task.objects.create(
            id=deleted_id,
            user=self.user,
            title='Deleted Task',
            status='inbox',
            tags=[],
            is_top_priority=False,
            is_two_minute_task=False,
            created_at=self.now,
            updated_at=self.now,
            deleted_at=self.now,
        )
        
        response = self.client.get('/api/sync/full/')
        
        task_ids = [t['id'] for t in response.data['data']['tasks']]
        self.assertIn(active_id, task_ids)
        self.assertNotIn(deleted_id, task_ids)
    
    def test_sync_full_requires_authentication(self):
        """Test that full sync requires authentication."""
        self.client.logout()
        response = self.client.get('/api/sync/full/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    # ============ SYNC STATUS ENDPOINT ============
    
    def test_sync_status_endpoint_exists(self):
        """Test that GET /api/sync/status/ endpoint exists."""
        response = self.client.get('/api/sync/status/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_sync_status_returns_counts(self):
        """Test that status returns entity counts."""
        # Create some tasks
        for i in range(3):
            Task.objects.create(
                id=str(uuid.uuid4()),
                user=self.user,
                title=f'Task {i}',
                status='inbox',
                tags=[],
                is_top_priority=False,
                is_two_minute_task=False,
                created_at=self.now,
                updated_at=self.now,
            )
        
        response = self.client.get('/api/sync/status/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('counts', response.data)
        self.assertIn('server_time', response.data)
        self.assertEqual(response.data['counts']['tasks'], 3)
    
    def test_sync_status_requires_authentication(self):
        """Test that status requires authentication."""
        self.client.logout()
        response = self.client.get('/api/sync/status/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class TestSyncEntityCreation(APITestCase):
    """Test sync push for each of the 31 entities."""
    
    def setUp(self):
        """Set up test client and user."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='entity-test@example.com',
            password='testpass123',
            status='active'
        )
        self.client.force_authenticate(user=self.user)
        self.now = int(time.time() * 1000)
    
    def _push_entity(self, entity_type, data):
        """Helper to push an entity and return response."""
        return self.client.post('/api/sync/push/', {
            'changes': {entity_type: [data]}
        }, format='json')
    
    def test_sync_tasks(self):
        """Test syncing tasks entity."""
        response = self._push_entity('tasks', {
            'id': str(uuid.uuid4()),
            'title': 'Test Task',
            'status': 'todo',
            'tags': [],
            'is_top_priority': False,
            'is_two_minute_task': False,
            'created_at': self.now,
            'updated_at': self.now,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results']['tasks']['created'], 1)
    
    def test_sync_goals(self):
        """Test syncing goals entity."""
        response = self._push_entity('goals', {
            'id': str(uuid.uuid4()),
            'objective': 'Test Goal',
            'status': 'active',
            'created_at': self.now,
            'updated_at': self.now,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results']['goals']['created'], 1)
    
    def test_sync_keyResults(self):
        """Test syncing keyResults entity."""
        goal_id = str(uuid.uuid4())
        Goal.objects.create(
            id=goal_id,
            user=self.user,
            objective='Test Goal',
            status='active',
            created_at=self.now,
            updated_at=self.now,
        )
        
        response = self._push_entity('keyResults', {
            'id': str(uuid.uuid4()),
            'goal_id': goal_id,
            'description': 'Test KR',
            'current_value': 0,
            'target_value': 100,
            'unit': '%',
            'created_at': self.now,
            'updated_at': self.now,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results']['keyResults']['created'], 1)
    
    def test_sync_habits(self):
        """Test syncing habits entity."""
        response = self._push_entity('habits', {
            'id': str(uuid.uuid4()),
            'name': 'Test Habit',
            'frequency': 'daily',
            'is_active': True,
            'created_at': self.now,
            'updated_at': self.now,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results']['habits']['created'], 1)
    
    def test_sync_habitLogs(self):
        """Test syncing habitLogs entity."""
        habit_id = str(uuid.uuid4())
        Habit.objects.create(
            id=habit_id,
            user=self.user,
            name='Test Habit',
            frequency='daily',
            is_active=True,
            created_at=self.now,
            updated_at=self.now,
        )
        
        response = self._push_entity('habitLogs', {
            'id': str(uuid.uuid4()),
            'habit_id': habit_id,
            'date': '2026-01-31',
            'completed_at': self.now,
            'created_at': self.now,
            'updated_at': self.now,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results']['habitLogs']['created'], 1)
    
    def test_sync_projects(self):
        """Test syncing projects entity."""
        response = self._push_entity('projects', {
            'id': str(uuid.uuid4()),
            'name': 'Test Project',
            'status': 'active',
            'tags': [],
            'created_at': self.now,
            'updated_at': self.now,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results']['projects']['created'], 1)
    
    def test_sync_inboxItems(self):
        """Test syncing inboxItems entity."""
        response = self._push_entity('inboxItems', {
            'id': str(uuid.uuid4()),
            'content': 'Test Inbox Item',
            'item_type': 'note',
            'is_processed': False,
            'created_at': self.now,
            'updated_at': self.now,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results']['inboxItems']['created'], 1)
    
    def test_sync_pomodoroSessions(self):
        """Test syncing pomodoroSessions entity."""
        response = self._push_entity('pomodoroSessions', {
            'id': str(uuid.uuid4()),
            'session_type': 'work',
            'duration_minutes': 25,
            'started_at': self.now,
            'date': '2026-01-31',
            'planned_minutes': 25,
            'actual_minutes': 25,
            'completed': True,
            'aborted': False,
            'interruptions_count': 0,
            'created_at': self.now,
            'updated_at': self.now,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results']['pomodoroSessions']['created'], 1)
    
    def test_sync_pomodoroPresets(self):
        """Test syncing pomodoroPresets entity."""
        response = self._push_entity('pomodoroPresets', {
            'id': str(uuid.uuid4()),
            'name': 'Custom 30/10',
            'focus_duration': 30,
            'break_duration': 10,
            'long_break_duration': 20,
            'sessions_before_long_break': 4,
            'is_default': False,
            'created_at': self.now,
            'updated_at': self.now,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results']['pomodoroPresets']['created'], 1)
    
    def test_sync_calendarBlocks(self):
        """Test syncing calendarBlocks entity."""
        response = self._push_entity('calendarBlocks', {
            'id': str(uuid.uuid4()),
            'title': 'Meeting',
            'start_time': 540,
            'end_time': 600,
            'date': '2026-01-31',
            'color': '#3b82f6',
            'created_at': self.now,
            'updated_at': self.now,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results']['calendarBlocks']['created'], 1)
    
    def test_sync_dailyNotes(self):
        """Test syncing dailyNotes entity."""
        response = self._push_entity('dailyNotes', {
            'id': str(uuid.uuid4()),
            'date': '2026-01-31',
            'content': 'Today was productive.',
            'created_at': self.now,
            'updated_at': self.now,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results']['dailyNotes']['created'], 1)
    
    def test_sync_userSettings(self):
        """Test syncing userSettings entity."""
        response = self._push_entity('userSettings', {
            'id': str(uuid.uuid4()),
            'theme': 'dark',
            'created_at': self.now,
            'updated_at': self.now,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results']['userSettings']['created'], 1)
    
    def test_sync_references(self):
        """Test syncing references entity."""
        response = self._push_entity('references', {
            'id': str(uuid.uuid4()),
            'title': 'Important Link',
            'content': 'Some reference content',
            'source_url': 'https://example.com',
            'tags': [],
            'created_at': self.now,
            'updated_at': self.now,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results']['references']['created'], 1)
    
    def test_sync_financeCategories(self):
        """Test syncing financeCategories entity."""
        response = self._push_entity('financeCategories', {
            'id': str(uuid.uuid4()),
            'name': 'Alimentação',
            'type': 'expense',
            'color': '#ef4444',
            'icon': '🍔',
            'created_at': self.now,
            'updated_at': self.now,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results']['financeCategories']['created'], 1)
    
    def test_sync_financeAccounts(self):
        """Test syncing financeAccounts entity."""
        response = self._push_entity('financeAccounts', {
            'id': str(uuid.uuid4()),
            'name': 'Nubank',
            'type': 'checking',
            'balance': '1000.00',
            'color': '#8b5cf6',
            'icon': '💳',
            'created_at': self.now,
            'updated_at': self.now,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results']['financeAccounts']['created'], 1)
    
    def test_sync_financeTransactions(self):
        """Test syncing financeTransactions entity."""
        account_id = str(uuid.uuid4())
        # Create account first
        FinanceAccount.objects.create(
            id=account_id,
            user=self.user,
            name='Test Account',
            type='checking',
            balance='1000.00',
            created_at=self.now,
            updated_at=self.now,
        )
        response = self._push_entity('financeTransactions', {
            'id': str(uuid.uuid4()),
            'description': 'Almoço',
            'amount': '25.00',
            'type': 'expense',
            'date': '2026-01-31',
            'account_id': account_id,
            'is_recurring': False,
            'created_at': self.now,
            'updated_at': self.now,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results']['financeTransactions']['created'], 1)
    
    def test_sync_books(self):
        """Test syncing books entity."""
        response = self._push_entity('books', {
            'id': str(uuid.uuid4()),
            'title': 'Clean Code',
            'author': 'Robert C. Martin',
            'status': 'reading',
            'total_pages': 464,
            'current_page': 100,
            'start_date': '2026-01-01',
            'target_end_date': '2026-03-01',
            'created_at': self.now,
            'updated_at': self.now,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results']['books']['created'], 1)
    
    def test_sync_subjects(self):
        """Test syncing subjects entity."""
        response = self._push_entity('subjects', {
            'id': str(uuid.uuid4()),
            'name': 'Mathematics',
            'color': '#3b82f6',
            'icon': '📐',
            'created_at': self.now,
            'updated_at': self.now,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results']['subjects']['created'], 1)
    
    def test_sync_studySessions(self):
        """Test syncing studySessions entity."""
        subject_id = str(uuid.uuid4())
        Subject.objects.create(
            id=subject_id,
            user=self.user,
            name='Math',
            color='#3b82f6',
            created_at=self.now,
            updated_at=self.now,
        )
        
        response = self._push_entity('studySessions', {
            'id': str(uuid.uuid4()),
            'subject_id': subject_id,
            'date': '2026-01-31',
            'start_time': 540,
            'end_time': 600,
            'duration_minutes': 60,
            'quick_notes': 'Studied calculus',
            'self_test_questions': [],
            'created_at': self.now,
            'updated_at': self.now,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results']['studySessions']['created'], 1)
    
    def test_sync_wellnessPrograms(self):
        """Test syncing wellnessPrograms entity."""
        response = self._push_entity('wellnessPrograms', {
            'id': str(uuid.uuid4()),
            'type': 'meditation',
            'duration': 30,
            'start_date': '2026-01-01',
            'is_active': True,
            'current_day': 1,
            'created_at': self.now,
            'updated_at': self.now,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results']['wellnessPrograms']['created'], 1)
    
    def test_sync_workoutExercises(self):
        """Test syncing workoutExercises entity."""
        response = self._push_entity('workoutExercises', {
            'id': str(uuid.uuid4()),
            'name': 'Bench Press',
            'muscle_group': 'chest',
            'equipment': 'barbell',
            'created_at': self.now,
            'updated_at': self.now,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results']['workoutExercises']['created'], 1)
    
    def test_sync_workoutPlans(self):
        """Test syncing workoutPlans entity."""
        response = self._push_entity('workoutPlans', {
            'id': str(uuid.uuid4()),
            'name': 'Push Pull Legs',
            'notes': 'PPL split',
            'is_archived': False,
            'created_at': self.now,
            'updated_at': self.now,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results']['workoutPlans']['created'], 1)
    
    def test_sync_dietMealTemplates(self):
        """Test syncing dietMealTemplates entity."""
        response = self._push_entity('dietMealTemplates', {
            'id': str(uuid.uuid4()),
            'name': 'Breakfast Template',
            'default_time_minutes': 480,
            'foods': [],
            'frequency': 'weekdays',
            'days_of_week': [],
            'created_at': self.now,
            'updated_at': self.now,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results']['dietMealTemplates']['created'], 1)
    
    def test_sync_dietMeals(self):
        """Test syncing dietMeals entity."""
        response = self._push_entity('dietMeals', {
            'id': str(uuid.uuid4()),
            'date': '2026-01-31',
            'name': 'Grilled Chicken Lunch',
            'time_minutes': 720,
            'foods': [],
            'is_completed': False,
            'created_at': self.now,
            'updated_at': self.now,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results']['dietMeals']['created'], 1)

    def test_sync_workoutPlanDayStatuses(self):
        """Test syncing workoutPlanDayStatuses entity."""
        plan_id = str(uuid.uuid4())
        # Create the parent plan so FK is satisfied
        WorkoutPlan.objects.create(
            id=plan_id,
            user=self.user,
            name='Push Pull Legs',
            created_at=self.now,
            updated_at=self.now,
        )
        response = self._push_entity('workoutPlanDayStatuses', {
            'id': str(uuid.uuid4()),
            'plan_id': plan_id,
            'date': '2026-02-01',
            'resolution': 'done',
            'moved_to_date': '',
            'created_at': self.now,
            'updated_at': self.now,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results']['workoutPlanDayStatuses']['created'], 1)

        # Pull should include the newly created entity
        pull_response = self.client.get('/api/sync/pull/')
        self.assertEqual(pull_response.status_code, status.HTTP_200_OK)
        self.assertIn('workoutPlanDayStatuses', pull_response.data['changes'])
        self.assertEqual(len(pull_response.data['changes']['workoutPlanDayStatuses']), 1)


class TestSyncPushInvalidUUID(APITestCase):
    """
    Test that sync push returns validation error for invalid UUID ids.
    (Audit R10 finding #7)
    """

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='uuid-test@example.com',
            password='testpass123',
            status='active',
        )
        self.client.force_authenticate(user=self.user)
        self.now = int(time.time() * 1000)

    def test_invalid_uuid_returns_validation_error(self):
        """Push with non-UUID id should return per-item error, not 500."""
        response = self.client.post('/api/sync/push/', {
            'changes': {
                'tasks': [{
                    'id': 'not-a-uuid',
                    'title': 'Bad ID',
                    'status': 'todo',
                    'tags': [],
                    'is_top_priority': False,
                    'is_two_minute_task': False,
                    'created_at': self.now,
                    'updated_at': self.now,
                }]
            }
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        errors = response.data['results']['tasks']['errors']
        self.assertEqual(len(errors), 1)
        self.assertIn('UUID', errors[0]['error'])

    def test_gcal_style_id_returns_validation_error(self):
        """IDs like 'gcal_abc_2026-01-31_0_60' must be rejected as non-UUID."""
        response = self.client.post('/api/sync/push/', {
            'changes': {
                'googleCalendarEvents': [{
                    'id': 'gcal_abc123_2026-01-31_0_60',
                    'google_event_id': 'abc123',
                    'title': 'Event',
                    'start_time': 0,
                    'end_time': 60,
                    'date': '2026-01-31',
                    'is_read_only': True,
                    'last_synced_at': self.now,
                    'created_at': self.now,
                    'updated_at': self.now,
                }]
            }
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        errors = response.data['results']['googleCalendarEvents']['errors']
        self.assertGreaterEqual(len(errors), 1)
        self.assertIn('UUID', errors[0]['error'])
