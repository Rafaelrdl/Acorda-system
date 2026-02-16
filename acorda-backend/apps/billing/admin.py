"""
Admin configuration for billing app.
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import Plan, Subscription, Payment, UsageRecord


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0
    fields = ['mp_payment_id', 'amount', 'currency', 'status', 'paid_at']
    readonly_fields = ['mp_payment_id', 'amount', 'currency', 'status', 'paid_at']
    can_delete = False
    max_num = 0
    show_change_link = True


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'plan_type', 'billing_cycle', 'price_display',
        'has_ai', 'ai_requests_limit', 'pdf_max_count',
        'is_active', 'subscriber_count',
    ]
    list_filter = ['plan_type', 'billing_cycle', 'is_active', 'has_ai']
    search_fields = ['name', 'mp_plan_id']
    ordering = ['price']
    list_per_page = 20
    list_editable = ['is_active']

    fieldsets = (
        (None, {'fields': ('name', 'plan_type', 'billing_cycle')}),
        ('Preço', {'fields': ('price', 'currency')}),
        ('Mercado Pago', {'fields': ('mp_plan_id',), 'classes': ('collapse',)}),
        ('Funcionalidades de IA', {'fields': ('has_ai', 'ai_requests_limit')}),
        ('Limites de PDF', {'fields': ('pdf_max_count', 'pdf_max_total_mb', 'pdf_max_file_mb')}),
        ('Status', {'fields': ('is_active',)}),
    )

    @admin.display(description='Preço', ordering='price')
    def price_display(self, obj):
        return f'{obj.currency} {obj.price:,.2f}'

    @admin.display(description='Assinantes')
    def subscriber_count(self, obj):
        return obj.subscriptions.filter(status='active').count()


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'plan', 'status_badge', 'is_lifetime_display',
        'started_at', 'current_period_end', 'created_at',
    ]
    list_filter = ['status', 'plan__plan_type', 'plan__billing_cycle', 'created_at']
    search_fields = ['user__email', 'mp_subscription_id', 'mp_payer_id']
    raw_id_fields = ['user', 'plan']
    ordering = ['-created_at']
    list_per_page = 25
    date_hierarchy = 'created_at'
    inlines = [PaymentInline]

    fieldsets = (
        (None, {'fields': ('user', 'plan', 'status')}),
        ('Mercado Pago', {
            'fields': ('mp_subscription_id', 'mp_payer_id'),
            'classes': ('collapse',),
        }),
        ('Datas', {
            'fields': ('started_at', 'current_period_start', 'current_period_end', 'cancelled_at'),
        }),
    )

    actions = ['activate_subscriptions', 'cancel_subscriptions']

    @admin.display(description='Status', ordering='status')
    def status_badge(self, obj):
        colors = {
            'pending': '#f0ad4e',
            'active': '#5cb85c',
            'past_due': '#d9534f',
            'cancelled': '#777',
            'expired': '#999',
        }
        color = colors.get(obj.status, '#777')
        return format_html(
            '<span style="background:{}; color:#fff; padding:3px 10px; '
            'border-radius:3px; font-size:11px;">{}</span>',
            color, obj.get_status_display(),
        )

    @admin.display(description='Lifetime', boolean=True)
    def is_lifetime_display(self, obj):
        return obj.is_lifetime

    @admin.action(description='Ativar assinaturas selecionadas')
    def activate_subscriptions(self, request, queryset):
        updated = queryset.exclude(status=Subscription.Status.ACTIVE).update(
            status=Subscription.Status.ACTIVE,
        )
        self.message_user(request, f'{updated} assinatura(s) ativada(s).')

    @admin.action(description='Cancelar assinaturas selecionadas')
    def cancel_subscriptions(self, request, queryset):
        from django.utils import timezone
        updated = queryset.exclude(status=Subscription.Status.CANCELLED).update(
            status=Subscription.Status.CANCELLED,
            cancelled_at=timezone.now(),
        )
        self.message_user(request, f'{updated} assinatura(s) cancelada(s).')


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = [
        'mp_payment_id', 'user', 'plan', 'amount_display',
        'status_badge', 'payment_type', 'payer_email', 'paid_at',
    ]
    list_filter = ['status', 'payment_type', 'plan__plan_type', 'created_at']
    search_fields = ['mp_payment_id', 'user__email', 'payer_email', 'payer_name']
    raw_id_fields = ['user', 'subscription', 'plan']
    ordering = ['-created_at']
    list_per_page = 25
    date_hierarchy = 'created_at'
    readonly_fields = ['metadata', 'created_at', 'updated_at']

    fieldsets = (
        (None, {'fields': ('user', 'subscription', 'plan', 'payment_type', 'status')}),
        ('Valores', {'fields': ('amount', 'currency')}),
        ('Mercado Pago', {
            'fields': ('mp_payment_id', 'mp_preference_id', 'mp_status', 'mp_status_detail'),
        }),
        ('Pagador', {'fields': ('payer_email', 'payer_name')}),
        ('Datas', {'fields': ('created_at', 'updated_at', 'paid_at')}),
        ('Metadata', {'fields': ('metadata',), 'classes': ('collapse',)}),
    )

    actions = ['approve_payments', 'reject_payments']

    @admin.display(description='Valor', ordering='amount')
    def amount_display(self, obj):
        return f'{obj.currency} {obj.amount:,.2f}'

    @admin.display(description='Status', ordering='status')
    def status_badge(self, obj):
        colors = {
            'pending': '#f0ad4e',
            'approved': '#5cb85c',
            'rejected': '#d9534f',
            'refunded': '#5bc0de',
            'cancelled': '#777',
        }
        color = colors.get(obj.status, '#777')
        return format_html(
            '<span style="background:{}; color:#fff; padding:3px 10px; '
            'border-radius:3px; font-size:11px;">{}</span>',
            color, obj.get_status_display(),
        )

    @admin.action(description='Aprovar pagamentos selecionados')
    def approve_payments(self, request, queryset):
        from django.utils import timezone
        updated = queryset.filter(status=Payment.Status.PENDING).update(
            status=Payment.Status.APPROVED,
            paid_at=timezone.now(),
        )
        self.message_user(request, f'{updated} pagamento(s) aprovado(s).')

    @admin.action(description='Rejeitar pagamentos selecionados')
    def reject_payments(self, request, queryset):
        updated = queryset.filter(status=Payment.Status.PENDING).update(
            status=Payment.Status.REJECTED,
        )
        self.message_user(request, f'{updated} pagamento(s) rejeitado(s).')


@admin.register(UsageRecord)
class UsageRecordAdmin(admin.ModelAdmin):
    list_display = ['user', 'feature', 'date', 'count']
    list_filter = ['feature', 'date']
    search_fields = ['user__email', 'feature']
    raw_id_fields = ['user']
    ordering = ['-date']
    list_per_page = 50
    readonly_fields = ['created_at', 'updated_at']
