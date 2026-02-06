"""
Admin configuration for billing app.
"""
from django.contrib import admin
from .models import Plan, Subscription, Payment, UsageRecord


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'plan_type', 'billing_cycle', 'price', 'has_ai', 'is_active']
    list_filter = ['plan_type', 'billing_cycle', 'is_active', 'has_ai']
    search_fields = ['name']
    ordering = ['price']


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ['user', 'plan', 'status', 'started_at', 'current_period_end']
    list_filter = ['status', 'plan__plan_type', 'created_at']
    search_fields = ['user__email', 'mp_subscription_id']
    raw_id_fields = ['user', 'plan']
    ordering = ['-created_at']


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['mp_payment_id', 'user', 'plan', 'amount', 'status', 'paid_at']
    list_filter = ['status', 'payment_type', 'plan__plan_type', 'created_at']
    search_fields = ['mp_payment_id', 'user__email', 'payer_email']
    raw_id_fields = ['user', 'subscription', 'plan']
    ordering = ['-created_at']
    readonly_fields = ['metadata']


@admin.register(UsageRecord)
class UsageRecordAdmin(admin.ModelAdmin):
    list_display = ['user', 'feature', 'date', 'count']
    list_filter = ['feature', 'date']
    search_fields = ['user__email']
    raw_id_fields = ['user']
    ordering = ['-date']
