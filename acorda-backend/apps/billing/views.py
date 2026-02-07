"""
Views for billing app.
"""
import hashlib
import hmac
import json
import logging
from datetime import date
from urllib.parse import quote as url_quote

from django.conf import settings
from django.utils import timezone
from django.db import models, transaction
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from apps.accounts.models import User, ActivationToken
from apps.accounts.tasks import send_activation_email
from .models import Plan, Subscription, Payment, UsageRecord
from .serializers import (
    PlanSerializer,
    SubscriptionSerializer,
    PaymentSerializer,
    CreateCheckoutSerializer,
    UsageSummarySerializer,
)
from .services import mp_service

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _build_external_reference(plan, payer_email: str) -> str:
    """Build an external_reference that carries plan id + billing cycle."""
    return f"acorda|{plan.id}|{plan.billing_cycle}|{payer_email}"


def _parse_external_reference(external_reference: str) -> dict:
    """Parse external_reference built by _build_external_reference."""
    parts = external_reference.split('|')
    if len(parts) >= 4 and parts[0] == 'acorda':
        return {
            'plan_id': parts[1],
            'billing_cycle': parts[2],
            'email': parts[3],
        }
    # Legacy format: acorda_type_email_timestamp
    if external_reference.startswith('acorda_'):
        legacy = external_reference.split('_')
        return {
            'plan_type': legacy[1] if len(legacy) >= 2 else None,
            'email': legacy[2] if len(legacy) >= 3 else None,
        }
    return {}


def _verify_mp_webhook_signature(request) -> bool:
    """
    Verify Mercado Pago webhook HMAC signature.
    Returns True when signature is valid or when no secret is configured (dev).
    """
    secret = getattr(settings, 'MP_WEBHOOK_SECRET', '')
    if not secret:
        if settings.DEBUG:
            logger.warning("MP_WEBHOOK_SECRET not set – skipping signature verification (DEBUG mode)")
            return True
        # In production, refuse to process unsigned webhooks
        logger.error("MP_WEBHOOK_SECRET not set in production – rejecting webhook")
        return False

    x_signature = request.headers.get('x-signature', '')
    x_request_id = request.headers.get('x-request-id', '')

    if not x_signature or not x_request_id:
        return False

    # Parse ts and v1 from x-signature header: "ts=...,v1=..."
    parts_dict: dict[str, str] = {}
    for part in x_signature.split(','):
        kv = part.strip().split('=', 1)
        if len(kv) == 2:
            parts_dict[kv[0].strip()] = kv[1].strip()

    ts = parts_dict.get('ts', '')
    v1 = parts_dict.get('v1', '')
    if not ts or not v1:
        return False

    # data.id from the notification body
    data_id = ''
    body = request.data
    if isinstance(body, dict):
        data_id = str(body.get('data', {}).get('id', ''))

    # Build the manifest to sign
    manifest = f"id:{data_id};request-id:{x_request_id};ts:{ts};"

    # Compute HMAC-SHA256
    computed = hmac.new(
        secret.encode(),
        manifest.encode(),
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(computed, v1)


class PlansView(APIView):
    """List available plans."""
    
    permission_classes = [AllowAny]
    
    def get(self, request):
        plans = Plan.objects.filter(is_active=True)
        serializer = PlanSerializer(plans, many=True)
        return Response(serializer.data)


class CreateCheckoutView(APIView):
    """Create checkout session for payment."""
    
    permission_classes = [AllowAny]  # Allow unauthenticated purchases
    
    def post(self, request):
        serializer = CreateCheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        plan = serializer.plan
        payer_email = serializer.validated_data['payer_email']
        payer_name = serializer.validated_data.get('payer_name', '')
        
        # Generate external reference with plan id + billing cycle for reliable lookup
        external_reference = _build_external_reference(plan, payer_email)
        
        if plan.billing_cycle == Plan.BillingCycle.LIFETIME:
            # One-time payment
            result = mp_service.create_checkout_preference(
                plan=plan,
                payer_email=payer_email,
                payer_name=payer_name,
                external_reference=external_reference,
            )
        else:
            # Subscription
            result = mp_service.create_subscription_preapproval(
                plan=plan,
                payer_email=payer_email,
                external_reference=external_reference,
            )
        
        if result.get('success'):
            return Response({
                'checkout_url': result.get('init_point') or result.get('sandbox_init_point'),
                'preference_id': result.get('preference_id') or result.get('preapproval_id'),
            })
        else:
            return Response(
                {'error': result.get('error', 'Erro ao criar checkout')},
                status=status.HTTP_400_BAD_REQUEST
            )


class WebhookView(APIView):
    """Handle Mercado Pago webhooks."""
    
    permission_classes = [AllowAny]
    
    def post(self, request):
        # Verify webhook signature
        if not _verify_mp_webhook_signature(request):
            logger.warning("MP Webhook signature verification failed")
            return Response(
                {'error': 'Invalid signature'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        
        data = request.data
        topic = data.get('type') or request.query_params.get('topic')
        resource_id = data.get('data', {}).get('id') or request.query_params.get('id')
        
        logger.info(f"MP Webhook received: topic={topic}, id={resource_id}")
        
        if not topic or not resource_id:
            return Response({'status': 'ignored'})
        
        try:
            if topic == 'payment':
                self._handle_payment(resource_id)
            elif topic in ['subscription_preapproval', 'preapproval']:
                self._handle_subscription(resource_id)
            elif topic == 'subscription_authorized_payment':
                self._handle_subscription_payment(resource_id)
            
            return Response({'status': 'ok'})
        except Exception as e:
            logger.exception(f"Webhook processing error: {e}")
            return Response(
                {'error': 'Erro interno ao processar notificação.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @transaction.atomic
    def _handle_payment(self, payment_id: str):
        """Handle payment notification."""
        mp_payment = mp_service.get_payment(payment_id)
        if not mp_payment:
            logger.warning(f"Payment not found: {payment_id}")
            return
        
        mp_status = mp_payment.get('status')
        payer_email = mp_payment.get('payer', {}).get('email', '')
        payer_name = (
            mp_payment.get('payer', {}).get('first_name', '') + ' ' +
            mp_payment.get('payer', {}).get('last_name', '')
        ).strip()
        amount = mp_payment.get('transaction_amount')
        external_reference = mp_payment.get('external_reference', '')

        # Resolve plan early so Payment is always persisted with plan + type
        plan = self._get_plan_from_reference(external_reference, mp_payment)
        payment_type = ''
        if plan:
            payment_type = (
                Payment.PaymentType.ONE_TIME
                if plan.billing_cycle == Plan.BillingCycle.LIFETIME
                else Payment.PaymentType.SUBSCRIPTION
            )
        
        # Check if payment already exists
        payment, created = Payment.objects.get_or_create(
            mp_payment_id=payment_id,
            defaults={
                'amount': amount or 0,
                'payer_email': payer_email,
                'payer_name': payer_name,
                'mp_status': mp_status,
                'metadata': mp_payment,
                'plan': plan,
                'payment_type': payment_type,
            }
        )
        
        if not created:
            # Update existing payment
            payment.mp_status = mp_status
            if plan and not payment.plan:
                payment.plan = plan
                payment.payment_type = payment_type

            # Map mp_status → Payment.Status for non-approved states
            status_map = {
                'approved': Payment.Status.APPROVED,
                'rejected': Payment.Status.REJECTED,
                'cancelled': Payment.Status.CANCELLED,
                'refunded': Payment.Status.REFUNDED,
                'charged_back': Payment.Status.REFUNDED,
                'in_process': Payment.Status.PENDING,
                'in_mediation': Payment.Status.PENDING,
            }
            mapped = status_map.get(mp_status)
            if mapped and payment.status != mapped:
                payment.status = mapped
                if mapped == Payment.Status.APPROVED and not payment.paid_at:
                    payment.paid_at = timezone.now()

            payment.save(update_fields=['mp_status', 'status', 'plan', 'payment_type', 'paid_at', 'updated_at'])
        
        # Process approved payments
        if mp_status == 'approved' and payment.status != Payment.Status.APPROVED:
            self._process_approved_payment(payment, payer_email, payer_name, external_reference, mp_payment)
    
    def _process_approved_payment(self, payment, payer_email: str, payer_name: str, external_reference: str, mp_payment: dict):
        """Process an approved payment - create user and send activation."""
        
        plan = payment.plan
        if not plan:
            # Attempt resolution again
            plan = self._get_plan_from_reference(external_reference, mp_payment)
        if not plan:
            logger.error(f"Could not determine plan for payment {payment.mp_payment_id}")
            return
        
        payment.plan = plan
        payment.payment_type = (
            Payment.PaymentType.ONE_TIME 
            if plan.billing_cycle == Plan.BillingCycle.LIFETIME 
            else Payment.PaymentType.SUBSCRIPTION
        )
        payment.status = Payment.Status.APPROVED
        payment.paid_at = timezone.now()
        
        # Get or create user
        user, user_created = User.objects.get_or_create(
            email=payer_email.lower().strip(),
            defaults={
                'name': payer_name,
                'status': User.Status.PENDING_ACTIVATION,
            }
        )
        
        payment.user = user
        payment.save()
        
        # Try to extract mp_subscription_id from payment metadata
        mp_subscription_id = ''
        # Mercado Pago includes the preapproval_id in metadata.preapproval_id
        # or in the point_of_interaction for subscription payments
        if isinstance(mp_payment, dict):
            mp_subscription_id = (
                mp_payment.get('metadata', {}).get('preapproval_id', '')
                or mp_payment.get('point_of_interaction', {}).get('transaction_data', {}).get('subscription_id', '')
                or ''
            )

        # Upsert subscription: renew existing active/pending sub for user+plan,
        # or create a new one.  Prevents duplicates on recurring payments.
        existing_sub = Subscription.objects.filter(
            user=user,
            plan=plan,
            status__in=[Subscription.Status.ACTIVE, Subscription.Status.PENDING],
        ).first()

        if existing_sub:
            subscription = existing_sub
            subscription.status = Subscription.Status.ACTIVE
            subscription.current_period_start = timezone.now()
            if mp_subscription_id:
                subscription.mp_subscription_id = mp_subscription_id
        else:
            subscription = Subscription(
                user=user,
                plan=plan,
                status=Subscription.Status.ACTIVE,
                started_at=timezone.now(),
                current_period_start=timezone.now(),
                mp_subscription_id=mp_subscription_id,
            )
        
        # Set period end based on billing cycle
        if plan.billing_cycle == Plan.BillingCycle.MONTHLY:
            subscription.current_period_end = timezone.now() + timezone.timedelta(days=30)
        elif plan.billing_cycle == Plan.BillingCycle.YEARLY:
            subscription.current_period_end = timezone.now() + timezone.timedelta(days=365)
        else:  # Lifetime
            subscription.current_period_end = None  # Never expires
        
        subscription.save()
        payment.subscription = subscription
        payment.save()
        
        # Create activation token and send email
        if user_created or user.status == User.Status.PENDING_ACTIVATION:
            activation_token = ActivationToken.objects.create(user=user)
            send_activation_email.delay(str(user.id), activation_token.token)
            logger.info(f"Activation email sent to {user.email}")
    
    def _get_plan_from_reference(self, external_reference: str, metadata: dict) -> Plan:
        """Extract plan from external reference or metadata."""
        parsed = _parse_external_reference(external_reference)

        # New format: plan_id is a UUID
        plan_id = parsed.get('plan_id')
        if plan_id:
            try:
                return Plan.objects.get(id=plan_id, is_active=True)
            except (Plan.DoesNotExist, ValueError):
                pass

        # New format also carries billing_cycle
        plan_type = parsed.get('plan_type')
        billing_cycle = parsed.get('billing_cycle')
        if plan_type and billing_cycle:
            try:
                return Plan.objects.get(
                    plan_type=plan_type,
                    billing_cycle=billing_cycle,
                    is_active=True,
                )
            except Plan.DoesNotExist:
                pass

        # Legacy format: try plan_type with default monthly
        if plan_type:
            try:
                return Plan.objects.get(
                    plan_type=plan_type,
                    billing_cycle='monthly',
                    is_active=True,
                )
            except Plan.DoesNotExist:
                pass
        
        # Fallback: try to match by amount
        amount = metadata.get('transaction_amount') if isinstance(metadata, dict) else None
        if amount:
            try:
                return Plan.objects.get(price=amount, is_active=True)
            except (Plan.DoesNotExist, Plan.MultipleObjectsReturned):
                pass
        
        return None
    
    @transaction.atomic
    def _handle_subscription(self, preapproval_id: str):
        """Handle subscription status changes."""
        mp_subscription = mp_service.get_preapproval(preapproval_id)
        if not mp_subscription:
            return
        
        mp_status = mp_subscription.get('status')
        
        # Try to find subscription by mp_subscription_id first
        subscription = Subscription.objects.filter(
            mp_subscription_id=preapproval_id
        ).first()

        # Fallback: find by user email + plan (for subscriptions created before
        # mp_subscription_id was persisted)
        if not subscription:
            payer_email = mp_subscription.get('payer_email', '')
            if payer_email:
                subscription = Subscription.objects.filter(
                    user__email__iexact=payer_email,
                    mp_subscription_id='',
                    status__in=[Subscription.Status.ACTIVE, Subscription.Status.PENDING],
                ).first()
                if subscription:
                    subscription.mp_subscription_id = preapproval_id
                    subscription.save(update_fields=['mp_subscription_id', 'updated_at'])

        if not subscription:
            logger.warning(f"Subscription not found for preapproval: {preapproval_id}")
            return

        status_map = {
            'authorized': Subscription.Status.ACTIVE,
            'pending': Subscription.Status.PENDING,
            'paused': Subscription.Status.PAST_DUE,
            'cancelled': Subscription.Status.CANCELLED,
        }
        
        new_status = status_map.get(mp_status)
        if new_status and subscription.status != new_status:
            subscription.status = new_status
            if new_status == Subscription.Status.CANCELLED:
                subscription.cancelled_at = timezone.now()
            subscription.save()
    
    def _handle_subscription_payment(self, payment_id: str):
        """Handle recurring subscription payment."""
        self._handle_payment(payment_id)


class SubscriptionView(APIView):
    """Get current user's subscription."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        subscription = Subscription.objects.filter(
            user=request.user,
            status__in=[Subscription.Status.ACTIVE, Subscription.Status.PAST_DUE]
        ).select_related('plan').first()
        
        if subscription:
            serializer = SubscriptionSerializer(subscription)
            return Response({'subscription': serializer.data})
        else:
            return Response({'subscription': None})
    
    def delete(self, request):
        """Cancel subscription."""
        subscription = Subscription.objects.filter(
            user=request.user,
            status=Subscription.Status.ACTIVE
        ).first()
        
        if not subscription:
            return Response(
                {'error': 'Nenhuma assinatura ativa encontrada.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if subscription.is_lifetime:
            return Response(
                {'error': 'Assinatura vitalícia não pode ser cancelada.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Cancel on Mercado Pago
        if subscription.mp_subscription_id:
            success = mp_service.cancel_subscription(subscription.mp_subscription_id)
            if not success:
                return Response(
                    {'error': 'Erro ao cancelar assinatura. Tente novamente.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        subscription.status = Subscription.Status.CANCELLED
        subscription.cancelled_at = timezone.now()
        subscription.save()
        
        return Response({'detail': 'Assinatura cancelada com sucesso.'})


class PaymentsView(APIView):
    """Get user's payment history."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        payments = Payment.objects.filter(
            user=request.user
        ).select_related('plan').order_by('-created_at')[:20]
        
        serializer = PaymentSerializer(payments, many=True)
        return Response(serializer.data)


class UsageView(APIView):
    """Get user's feature usage."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        today = date.today()
        first_day_of_month = today.replace(day=1)
        
        # Get active subscription
        subscription = Subscription.objects.filter(
            user=request.user,
            status=Subscription.Status.ACTIVE
        ).select_related('plan').first()
        
        if not subscription or not subscription.plan.has_ai:
            return Response({
                'has_ai': False,
                'usage': []
            })
        
        # Get AI usage for current month
        ai_usage = UsageRecord.objects.filter(
            user=request.user,
            feature='ai_requests',
            date__gte=first_day_of_month
        ).values('feature').annotate(
            total=models.Sum('count')
        ).order_by('feature').first()
        
        used = ai_usage.get('total', 0) if ai_usage else 0
        limit = subscription.plan.ai_requests_limit
        
        # Calculate next reset date (1st of next month)
        if today.month == 12:
            reset_date = today.replace(year=today.year + 1, month=1, day=1)
        else:
            reset_date = today.replace(month=today.month + 1, day=1)
        
        return Response({
            'has_ai': True,
            'usage': [{
                'feature': 'ai_requests',
                'used': used,
                'limit': limit,
                'remaining': max(0, limit - used) if limit else None,
                'reset_date': reset_date.isoformat(),
            }]
        })
