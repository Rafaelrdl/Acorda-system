"""
Comprehensive tests for Django Admin configuration.
Tests cover: admin registration, list views, search, filters,
actions, superuser command, and Jazzmin integration.
"""
import time
import uuid
from decimal import Decimal

from django.test import TestCase, override_settings
from django.contrib.admin.sites import AdminSite
from django.http import HttpResponse
from django.test import RequestFactory
from django.urls import reverse
from django.core.management import call_command
from io import StringIO

from apps.accounts.admin import UserAdmin, ActivationTokenAdmin, PasswordResetTokenAdmin
from apps.accounts.models import User, ActivationToken, PasswordResetToken

from apps.billing.admin import PlanAdmin, SubscriptionAdmin, PaymentAdmin, UsageRecordAdmin
from apps.billing.models import Plan, Subscription, Payment, UsageRecord

from apps.core.admin import (
    TaskAdmin, GoalAdmin, KeyResultAdmin, HabitAdmin, HabitLogAdmin,
    ProjectAdmin, InboxItemAdmin, PomodoroSessionAdmin, PomodoroPresetAdmin,
    CalendarBlockAdmin, DailyNoteAdmin, UserSettingsAdmin, ReferenceAdmin,
    GoogleCalendarConnectionAdmin, GoogleCalendarEventAdmin,
    FinanceCategoryAdmin, FinanceAccountAdmin, TransactionAdmin,
    IncomeAdmin, FixedExpenseAdmin, FinanceAuditLogAdmin,
    BookAdmin, ReadingLogAdmin, PDFDocumentAdmin, PDFHighlightAdmin, PDFFileAdmin,
    SubjectAdmin, StudySessionAdmin, ConsentLogAdmin,
    RecordedStudySessionAdmin, ReviewScheduleItemAdmin,
    WellnessProgramAdmin, WellnessCheckInAdmin, WellnessDayActionAdmin,
    WorkoutExerciseAdmin, WorkoutPlanAdmin, WorkoutPlanItemAdmin,
    WorkoutSessionAdmin, WorkoutSetLogAdmin, WorkoutPlanDayStatusAdmin,
    DietMealTemplateAdmin, DietMealEntryAdmin, DataExportAdmin,
)
from apps.core.models import (
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

# User imported directly from apps.accounts.models


def _now_ms():
    return int(time.time() * 1000)


class AdminSiteTestMixin:
    """Mixin for common admin site test setup."""

    def setUp(self):
        self.site = AdminSite()
        self.factory = RequestFactory()
        self.admin_user = User.objects.create_superuser(
            email='admin-test@acorda.app',
            password='TestPass123!',
            name='Admin Test',
        )
        self.regular_user = User.objects.create_user(
            email='user@acorda.app',
            password='UserPass123!',
            name='Regular User',
            status=User.Status.ACTIVE,
        )

    def _make_request(self, url='/admin/'):
        from django.contrib.sessions.middleware import SessionMiddleware
        from django.contrib.messages.middleware import MessageMiddleware
        request = self.factory.get(url)
        request.user = self.admin_user
        # Add session and messages support for admin actions
        get_response = lambda r: HttpResponse()
        SessionMiddleware(get_response).process_request(request)
        MessageMiddleware(get_response).process_request(request)
        request.session.save()
        return request


# ═══════════════════════════════════════════════════════════════
#  1. MODEL REGISTRATION TESTS
# ═══════════════════════════════════════════════════════════════

class TestAllModelsRegistered(TestCase):
    """Verify every model has an admin registration."""

    def test_accounts_models_registered(self):
        from django.contrib.admin import site
        self.assertIn(User, site._registry)
        self.assertIn(ActivationToken, site._registry)
        self.assertIn(PasswordResetToken, site._registry)

    def test_billing_models_registered(self):
        from django.contrib.admin import site
        self.assertIn(Plan, site._registry)
        self.assertIn(Subscription, site._registry)
        self.assertIn(Payment, site._registry)
        self.assertIn(UsageRecord, site._registry)

    def test_core_productivity_models_registered(self):
        from django.contrib.admin import site
        for model in [Task, Goal, KeyResult, Project, InboxItem]:
            self.assertIn(model, site._registry, f'{model.__name__} not registered')

    def test_core_habit_models_registered(self):
        from django.contrib.admin import site
        for model in [Habit, HabitLog]:
            self.assertIn(model, site._registry, f'{model.__name__} not registered')

    def test_core_pomodoro_models_registered(self):
        from django.contrib.admin import site
        for model in [PomodoroSession, PomodoroPreset]:
            self.assertIn(model, site._registry, f'{model.__name__} not registered')

    def test_core_calendar_models_registered(self):
        from django.contrib.admin import site
        for model in [CalendarBlock, DailyNote, UserSettings, Reference]:
            self.assertIn(model, site._registry, f'{model.__name__} not registered')

    def test_core_google_models_registered(self):
        from django.contrib.admin import site
        for model in [GoogleCalendarConnection, GoogleCalendarEvent]:
            self.assertIn(model, site._registry, f'{model.__name__} not registered')

    def test_core_finance_models_registered(self):
        from django.contrib.admin import site
        for model in [FinanceCategory, FinanceAccount, Transaction, Income,
                       FixedExpense, FinanceAuditLog]:
            self.assertIn(model, site._registry, f'{model.__name__} not registered')

    def test_core_reading_models_registered(self):
        from django.contrib.admin import site
        for model in [Book, ReadingLog, PDFDocument, PDFHighlight, PDFFile]:
            self.assertIn(model, site._registry, f'{model.__name__} not registered')

    def test_core_study_models_registered(self):
        from django.contrib.admin import site
        for model in [Subject, StudySession, ConsentLog,
                       RecordedStudySession, ReviewScheduleItem]:
            self.assertIn(model, site._registry, f'{model.__name__} not registered')

    def test_core_wellness_models_registered(self):
        from django.contrib.admin import site
        for model in [WellnessProgram, WellnessCheckIn, WellnessDayAction]:
            self.assertIn(model, site._registry, f'{model.__name__} not registered')

    def test_core_workout_models_registered(self):
        from django.contrib.admin import site
        for model in [WorkoutExercise, WorkoutPlan, WorkoutPlanItem,
                       WorkoutSession, WorkoutSetLog, WorkoutPlanDayStatus]:
            self.assertIn(model, site._registry, f'{model.__name__} not registered')

    def test_core_diet_models_registered(self):
        from django.contrib.admin import site
        for model in [DietMealTemplate, DietMealEntry]:
            self.assertIn(model, site._registry, f'{model.__name__} not registered')

    def test_core_export_model_registered(self):
        from django.contrib.admin import site
        self.assertIn(DataExport, site._registry)


# ═══════════════════════════════════════════════════════════════
#  2. ACCOUNTS ADMIN TESTS
# ═══════════════════════════════════════════════════════════════

class TestUserAdmin(AdminSiteTestMixin, TestCase):
    """Tests for User admin configuration."""

    def test_list_display_fields(self):
        ma = UserAdmin(User, self.site)
        request = self._make_request()
        display = ma.get_list_display(request)
        self.assertIn('email', display)
        self.assertIn('name', display)
        self.assertIn('status_badge', display)
        self.assertIn('is_staff', display)

    def test_status_badge_renders_html(self):
        ma = UserAdmin(User, self.site)
        badge = ma.status_badge(self.regular_user)
        self.assertIn('Ativo', str(badge))
        self.assertIn('background', str(badge))

    def test_activate_users_action(self):
        pending = User.objects.create_user(
            email='pending@test.com', password='pass123',
            status=User.Status.PENDING_ACTIVATION,
        )
        ma = UserAdmin(User, self.site)
        request = self._make_request()
        ma.activate_users(request, User.objects.filter(pk=pending.pk))
        pending.refresh_from_db()
        self.assertEqual(pending.status, User.Status.ACTIVE)

    def test_suspend_users_action(self):
        ma = UserAdmin(User, self.site)
        request = self._make_request()
        ma.suspend_users(request, User.objects.filter(pk=self.regular_user.pk))
        self.regular_user.refresh_from_db()
        self.assertEqual(self.regular_user.status, User.Status.SUSPENDED)

    def test_cancel_users_action(self):
        ma = UserAdmin(User, self.site)
        request = self._make_request()
        ma.cancel_users(request, User.objects.filter(pk=self.regular_user.pk))
        self.regular_user.refresh_from_db()
        self.assertEqual(self.regular_user.status, User.Status.CANCELLED)

    def test_inlines_present(self):
        ma = UserAdmin(User, self.site)
        inline_classes = [i.__class__.__name__ for i in ma.get_inline_instances(self._make_request())]
        self.assertIn('ActivationTokenInline', inline_classes)
        self.assertIn('PasswordResetTokenInline', inline_classes)


# ═══════════════════════════════════════════════════════════════
#  3. BILLING ADMIN TESTS
# ═══════════════════════════════════════════════════════════════

class TestBillingAdmin(AdminSiteTestMixin, TestCase):
    """Tests for billing admin configuration."""

    def setUp(self):
        super().setUp()
        self.plan = Plan.objects.create(
            name='Pro Mensal', plan_type='pro', billing_cycle='monthly',
            price=Decimal('39.90'), has_ai=False,
        )
        self.subscription = Subscription.objects.create(
            user=self.regular_user, plan=self.plan, status='active',
        )

    def test_plan_price_display(self):
        ma = PlanAdmin(Plan, self.site)
        self.assertIn('39.90', ma.price_display(self.plan))

    def test_plan_subscriber_count(self):
        ma = PlanAdmin(Plan, self.site)
        self.assertEqual(ma.subscriber_count(self.plan), 1)

    def test_subscription_status_badge(self):
        ma = SubscriptionAdmin(Subscription, self.site)
        badge = ma.status_badge(self.subscription)
        self.assertIn('Ativa', str(badge))

    def test_subscription_is_lifetime_display(self):
        ma = SubscriptionAdmin(Subscription, self.site)
        self.assertFalse(ma.is_lifetime_display(self.subscription))

    def test_activate_subscription_action(self):
        self.subscription.status = 'pending'
        self.subscription.save()
        ma = SubscriptionAdmin(Subscription, self.site)
        request = self._make_request()
        ma.activate_subscriptions(request, Subscription.objects.filter(pk=self.subscription.pk))
        self.subscription.refresh_from_db()
        self.assertEqual(self.subscription.status, 'active')

    def test_cancel_subscription_action(self):
        ma = SubscriptionAdmin(Subscription, self.site)
        request = self._make_request()
        ma.cancel_subscriptions(request, Subscription.objects.filter(pk=self.subscription.pk))
        self.subscription.refresh_from_db()
        self.assertEqual(self.subscription.status, 'cancelled')

    def test_payment_status_badge(self):
        payment = Payment.objects.create(
            user=self.regular_user, plan=self.plan,
            amount=Decimal('39.90'), mp_payment_id='PAY-001', status='approved',
        )
        ma = PaymentAdmin(Payment, self.site)
        badge = ma.status_badge(payment)
        self.assertIn('Aprovado', str(badge))

    def test_approve_payments_action(self):
        payment = Payment.objects.create(
            user=self.regular_user, plan=self.plan,
            amount=Decimal('39.90'), mp_payment_id='PAY-002', status='pending',
        )
        ma = PaymentAdmin(Payment, self.site)
        request = self._make_request()
        ma.approve_payments(request, Payment.objects.filter(pk=payment.pk))
        payment.refresh_from_db()
        self.assertEqual(payment.status, 'approved')
        self.assertIsNotNone(payment.paid_at)


# ═══════════════════════════════════════════════════════════════
#  4. CORE ADMIN TESTS
# ═══════════════════════════════════════════════════════════════

class TestCoreAdmin(AdminSiteTestMixin, TestCase):
    """Tests for core syncable model admin configuration."""

    def _create_task(self, **kwargs):
        defaults = {
            'user': self.regular_user,
            'title': 'Test task',
            'created_at': _now_ms(),
            'updated_at': _now_ms(),
        }
        defaults.update(kwargs)
        return Task.objects.create(**defaults)

    def test_task_status_badge(self):
        task = self._create_task(status='done')
        ma = TaskAdmin(Task, self.site)
        badge = ma.status_badge(task)
        self.assertIn('Concluído', str(badge))

    def test_task_is_deleted_display(self):
        task = self._create_task()
        ma = TaskAdmin(Task, self.site)
        self.assertFalse(ma.is_deleted(task))
        task.deleted_at = _now_ms()
        task.save()
        self.assertTrue(ma.is_deleted(task))

    def test_hard_delete_action(self):
        task = self._create_task(deleted_at=_now_ms())
        ma = TaskAdmin(Task, self.site)
        request = self._make_request()
        ma.hard_delete_soft_deleted(request, Task.objects.filter(pk=task.pk))
        self.assertFalse(Task.objects.filter(pk=task.pk).exists())

    def test_restore_action(self):
        task = self._create_task(deleted_at=_now_ms())
        ma = TaskAdmin(Task, self.site)
        request = self._make_request()
        ma.restore_soft_deleted(request, Task.objects.filter(pk=task.pk))
        task.refresh_from_db()
        self.assertIsNone(task.deleted_at)

    def test_goal_status_badge(self):
        goal = Goal.objects.create(
            user=self.regular_user, objective='Be awesome',
            status='completed', created_at=_now_ms(), updated_at=_now_ms(),
        )
        ma = GoalAdmin(Goal, self.site)
        badge = ma.status_badge(goal)
        self.assertIn('Concluída', str(badge))

    def test_key_result_progress(self):
        kr = KeyResult.objects.create(
            user=self.regular_user, goal_id=uuid.uuid4(),
            description='KR1', current_value=75, target_value=100,
            created_at=_now_ms(), updated_at=_now_ms(),
        )
        ma = KeyResultAdmin(KeyResult, self.site)
        progress = ma.progress_display(kr)
        self.assertIn('75%', str(progress))

    def test_inbox_content_short(self):
        item = InboxItem.objects.create(
            user=self.regular_user, content='A' * 100,
            created_at=_now_ms(), updated_at=_now_ms(),
        )
        ma = InboxItemAdmin(InboxItem, self.site)
        short = ma.content_short(item)
        self.assertTrue(short.endswith('...'))
        self.assertTrue(len(short) <= 84)

    def test_book_progress_display(self):
        book = Book.objects.create(
            user=self.regular_user, title='Clean Code', author='Uncle Bob',
            total_pages=200, current_page=100,
            start_date='2025-01-01', target_end_date='2025-03-01', status='reading',
            created_at=_now_ms(), updated_at=_now_ms(),
        )
        ma = BookAdmin(Book, self.site)
        progress = ma.progress_display(book)
        self.assertIn('50%', str(progress))

    def test_pdf_file_size_display(self):
        pdf = PDFDocument.objects.create(
            user=self.regular_user, file_name='test.pdf',
            file_size=2 * 1024 * 1024, total_pages=10, current_page=1,
            created_at=_now_ms(), updated_at=_now_ms(),
        )
        ma = PDFDocumentAdmin(PDFDocument, self.site)
        size = ma.file_size_display(pdf)
        self.assertIn('MB', size)

    def test_recorded_session_has_transcription(self):
        session = RecordedStudySession.objects.create(
            user=self.regular_user, subject_id=uuid.uuid4(),
            date='2025-01-01', duration_minutes=30,
            transcription='Some text', consent_log_id=uuid.uuid4(),
            created_at=_now_ms(), updated_at=_now_ms(),
        )
        ma = RecordedStudySessionAdmin(RecordedStudySession, self.site)
        self.assertTrue(ma.has_transcription(session))

    def test_reference_source_url_short(self):
        ref = Reference.objects.create(
            user=self.regular_user, title='Django Docs',
            content='Content', source_url='https://docs.djangoproject.com/en/5.0/',
            created_at=_now_ms(), updated_at=_now_ms(),
        )
        ma = ReferenceAdmin(Reference, self.site)
        url = ma.source_url_short(ref)
        self.assertIn('href', str(url))


# ═══════════════════════════════════════════════════════════════
#  5. SUPERUSER MANAGEMENT COMMAND TEST
# ═══════════════════════════════════════════════════════════════

class TestCreateDefaultSuperuser(TestCase):
    """Tests for create_default_superuser management command."""

    def test_creates_superuser(self):
        out = StringIO()
        call_command(
            'create_default_superuser',
            '--email=cmduser@acorda.app',
            '--username=CmdAdmin',
            '--password=CmdPass123!',
            stdout=out,
        )
        self.assertIn('created successfully', out.getvalue())
        user = User.objects.get(email='cmduser@acorda.app')
        self.assertTrue(user.is_superuser)
        self.assertTrue(user.is_staff)
        self.assertEqual(user.name, 'CmdAdmin')
        self.assertTrue(user.check_password('CmdPass123!'))

    def test_skips_if_exists(self):
        User.objects.create_superuser(
            email='existing@acorda.app', password='P@ss123',
        )
        out = StringIO()
        call_command(
            'create_default_superuser',
            '--email=existing@acorda.app',
            stdout=out,
        )
        self.assertIn('already exists', out.getvalue())

    def test_default_credentials(self):
        """Test that default args produce the expected admin user."""
        out = StringIO()
        call_command('create_default_superuser', stdout=out)
        self.assertIn('created successfully', out.getvalue())
        user = User.objects.get(email='admin@somosacorda.com')
        self.assertTrue(user.check_password('Rafael100@'))
        self.assertEqual(user.name, 'Admin')


# ═══════════════════════════════════════════════════════════════
#  6. ADMIN HTTP ACCESS TESTS
# ═══════════════════════════════════════════════════════════════

class TestAdminHTTPAccess(TestCase):
    """Test that admin pages are accessible to superusers."""

    def setUp(self):
        self.admin = User.objects.create_superuser(
            email='http-admin@acorda.app', password='HttpPass123!',
        )
        self.client.login(email='http-admin@acorda.app', password='HttpPass123!')

    def test_admin_index(self):
        response = self.client.get('/admin/')
        self.assertEqual(response.status_code, 200)

    def test_admin_login_page(self):
        self.client.logout()
        response = self.client.get('/admin/login/')
        self.assertEqual(response.status_code, 200)

    def test_user_changelist(self):
        response = self.client.get('/admin/accounts/user/')
        self.assertEqual(response.status_code, 200)

    def test_plan_changelist(self):
        response = self.client.get('/admin/billing/plan/')
        self.assertEqual(response.status_code, 200)

    def test_task_changelist(self):
        response = self.client.get('/admin/core/task/')
        self.assertEqual(response.status_code, 200)

    def test_subscription_changelist(self):
        response = self.client.get('/admin/billing/subscription/')
        self.assertEqual(response.status_code, 200)

    def test_payment_changelist(self):
        response = self.client.get('/admin/billing/payment/')
        self.assertEqual(response.status_code, 200)

    def test_habit_changelist(self):
        response = self.client.get('/admin/core/habit/')
        self.assertEqual(response.status_code, 200)

    def test_goal_changelist(self):
        response = self.client.get('/admin/core/goal/')
        self.assertEqual(response.status_code, 200)

    def test_project_changelist(self):
        response = self.client.get('/admin/core/project/')
        self.assertEqual(response.status_code, 200)

    def test_finance_changelist(self):
        response = self.client.get('/admin/core/transaction/')
        self.assertEqual(response.status_code, 200)

    def test_book_changelist(self):
        response = self.client.get('/admin/core/book/')
        self.assertEqual(response.status_code, 200)

    def test_workout_changelist(self):
        response = self.client.get('/admin/core/workoutexercise/')
        self.assertEqual(response.status_code, 200)

    def test_wellness_changelist(self):
        response = self.client.get('/admin/core/wellnessprogram/')
        self.assertEqual(response.status_code, 200)

    def test_diet_changelist(self):
        response = self.client.get('/admin/core/dietmealtemplate/')
        self.assertEqual(response.status_code, 200)

    def test_non_superuser_blocked(self):
        """Non-staff users should be redirected from admin."""
        User.objects.create_user(
            email='regular@acorda.app', password='Reg123!',
            status=User.Status.ACTIVE,
        )
        self.client.logout()
        self.client.login(email='regular@acorda.app', password='Reg123!')
        response = self.client.get('/admin/')
        self.assertEqual(response.status_code, 302)  # Redirect to login


# ═══════════════════════════════════════════════════════════════
#  7. JAZZMIN CONFIGURATION TEST
# ═══════════════════════════════════════════════════════════════

class TestJazzminConfig(TestCase):
    """Test that Jazzmin settings are properly configured."""

    def test_jazzmin_in_installed_apps(self):
        from django.conf import settings
        self.assertIn('jazzmin', settings.INSTALLED_APPS)
        # Must be before django.contrib.admin
        jazzmin_idx = settings.INSTALLED_APPS.index('jazzmin')
        admin_idx = settings.INSTALLED_APPS.index('django.contrib.admin')
        self.assertLess(jazzmin_idx, admin_idx)

    def test_jazzmin_settings_exist(self):
        from django.conf import settings
        self.assertTrue(hasattr(settings, 'JAZZMIN_SETTINGS'))
        self.assertEqual(settings.JAZZMIN_SETTINGS['site_title'], 'Acorda Admin')
        self.assertEqual(settings.JAZZMIN_SETTINGS['site_brand'], 'Acorda')

    def test_jazzmin_ui_tweaks_exist(self):
        from django.conf import settings
        self.assertTrue(hasattr(settings, 'JAZZMIN_UI_TWEAKS'))
        self.assertEqual(settings.JAZZMIN_UI_TWEAKS['theme'], 'darkly')

    def test_admin_renders_with_jazzmin(self):
        """Admin should render successfully with Jazzmin template."""
        admin = User.objects.create_superuser(
            email='jazzmin-test@acorda.app', password='Test123!',
        )
        self.client.login(email='jazzmin-test@acorda.app', password='Test123!')
        response = self.client.get('/admin/')
        self.assertEqual(response.status_code, 200)
        # Jazzmin injects its branding
        content = response.content.decode()
        self.assertIn('Acorda', content)
