"""
Serializers for billing app.
"""
from rest_framework import serializers
from .models import Plan, Subscription, Payment, UsageRecord


class PlanSerializer(serializers.ModelSerializer):
    """Serializer for plans."""
    
    class Meta:
        model = Plan
        fields = [
            'id', 'name', 'plan_type', 'billing_cycle',
            'price', 'currency', 'has_ai', 'ai_requests_limit',
            'pdf_max_count', 'pdf_max_total_mb', 'pdf_max_file_mb',
        ]


class SubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for subscriptions."""
    
    plan = PlanSerializer(read_only=True)
    
    class Meta:
        model = Subscription
        fields = [
            'id', 'plan', 'status', 'started_at',
            'current_period_start', 'current_period_end',
            'cancelled_at', 'is_active', 'is_lifetime'
        ]


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for payments."""
    
    plan = PlanSerializer(read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'plan', 'payment_type', 'status',
            'amount', 'currency', 'paid_at', 'created_at'
        ]


class CreateCheckoutSerializer(serializers.Serializer):
    """Serializer for creating checkout."""
    
    plan_id = serializers.UUIDField()
    payer_email = serializers.EmailField()
    payer_name = serializers.CharField(max_length=200, required=False, allow_blank=True)
    
    def validate_plan_id(self, value):
        try:
            plan = Plan.objects.get(id=value, is_active=True)
            self.plan = plan
            return value
        except Plan.DoesNotExist:
            raise serializers.ValidationError('Plano não encontrado.')


class UsageSerializer(serializers.ModelSerializer):
    """Serializer for usage records."""
    
    class Meta:
        model = UsageRecord
        fields = ['feature', 'date', 'count']
        read_only_fields = ['feature', 'date', 'count']


class UsageSummarySerializer(serializers.Serializer):
    """Serializer for usage summary."""
    
    feature = serializers.CharField()
    used = serializers.IntegerField()
    limit = serializers.IntegerField(allow_null=True)
    remaining = serializers.IntegerField(allow_null=True)
    reset_date = serializers.DateField()
