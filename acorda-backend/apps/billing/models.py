"""
Billing models for Acorda - Plans, Subscriptions, Payments.
"""
import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings


class Plan(models.Model):
    """Subscription plans available."""
    
    class PlanType(models.TextChoices):
        LEVE = 'leve', 'Acorda Leve'
        PRO = 'pro', 'Acorda Pro'
        PRO_IA = 'pro_ia', 'Acorda Pro IA'
        LIFETIME = 'lifetime', 'Lifetime (Pro)'
    
    class BillingCycle(models.TextChoices):
        MONTHLY = 'monthly', 'Mensal'
        YEARLY = 'yearly', 'Anual'
        LIFETIME = 'lifetime', 'Vitalício'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField('Nome', max_length=100)
    plan_type = models.CharField(
        'Tipo',
        max_length=20,
        choices=PlanType.choices,
        db_index=True
    )
    billing_cycle = models.CharField(
        'Ciclo',
        max_length=20,
        choices=BillingCycle.choices,
        db_index=True
    )
    
    # Pricing
    price = models.DecimalField('Preço', max_digits=10, decimal_places=2)
    currency = models.CharField('Moeda', max_length=3, default='BRL')
    
    # Mercado Pago IDs
    mp_plan_id = models.CharField(
        'MP Plan ID',
        max_length=100,
        blank=True,
        help_text='ID do plano no Mercado Pago (para assinaturas)'
    )
    
    # Features
    has_ai = models.BooleanField('Tem IA', default=False)
    ai_requests_limit = models.IntegerField(
        'Limite requisições IA/mês',
        null=True,
        blank=True
    )
    
    # PDF limits
    pdf_max_count = models.IntegerField(
        'Máx. PDFs',
        null=True,
        blank=True,
        help_text='Número máximo de PDFs permitidos'
    )
    pdf_max_total_mb = models.IntegerField(
        'Máx. armazenamento (MB)',
        null=True,
        blank=True,
        help_text='Armazenamento total máximo em MB'
    )
    pdf_max_file_mb = models.IntegerField(
        'Máx. tamanho por arquivo (MB)',
        null=True,
        blank=True,
        help_text='Tamanho máximo por arquivo em MB'
    )

    # Status
    is_active = models.BooleanField('Ativo', default=True)
    
    # Timestamps
    created_at = models.DateTimeField('Criado em', auto_now_add=True)
    updated_at = models.DateTimeField('Atualizado em', auto_now=True)
    
    class Meta:
        verbose_name = 'Plano'
        verbose_name_plural = 'Planos'
        unique_together = ['plan_type', 'billing_cycle']
        ordering = ['price']
    
    def __str__(self):
        return f'{self.name} - {self.get_billing_cycle_display()}'  # type: ignore[attr-defined]


class Subscription(models.Model):
    """User subscriptions."""
    
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pendente'
        ACTIVE = 'active', 'Ativa'
        PAST_DUE = 'past_due', 'Inadimplente'
        CANCELLED = 'cancelled', 'Cancelada'
        EXPIRED = 'expired', 'Expirada'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='subscriptions',
        verbose_name='Usuário'
    )
    plan = models.ForeignKey(
        Plan,
        on_delete=models.PROTECT,
        related_name='subscriptions',
        verbose_name='Plano'
    )
    
    # Status
    status = models.CharField(
        'Status',
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True
    )
    
    # Mercado Pago
    mp_subscription_id = models.CharField(
        'MP Subscription ID',
        max_length=100,
        blank=True,
        db_index=True
    )
    mp_payer_id = models.CharField('MP Payer ID', max_length=100, blank=True)
    
    # Dates
    started_at = models.DateTimeField('Iniciou em', null=True, blank=True)
    current_period_start = models.DateTimeField('Período atual início', null=True, blank=True)
    current_period_end = models.DateTimeField('Período atual fim', null=True, blank=True)
    cancelled_at = models.DateTimeField('Cancelada em', null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField('Criado em', auto_now_add=True)
    updated_at = models.DateTimeField('Atualizado em', auto_now=True)
    
    class Meta:
        verbose_name = 'Assinatura'
        verbose_name_plural = 'Assinaturas'
        ordering = ['-created_at']
    
    def __str__(self):
        return f'{self.user.email} - {self.plan.name}'
    
    @property
    def is_active(self):
        return self.status == self.Status.ACTIVE
    
    @property
    def is_lifetime(self):
        return self.plan.billing_cycle == Plan.BillingCycle.LIFETIME


class Payment(models.Model):
    """Payment records."""
    
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pendente'
        APPROVED = 'approved', 'Aprovado'
        REJECTED = 'rejected', 'Rejeitado'
        REFUNDED = 'refunded', 'Reembolsado'
        CANCELLED = 'cancelled', 'Cancelado'
    
    class PaymentType(models.TextChoices):
        SUBSCRIPTION = 'subscription', 'Assinatura'
        ONE_TIME = 'one_time', 'Pagamento Único'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payments',
        verbose_name='Usuário',
        null=True,
        blank=True
    )
    subscription = models.ForeignKey(
        Subscription,
        on_delete=models.SET_NULL,
        related_name='payments',
        verbose_name='Assinatura',
        null=True,
        blank=True
    )
    plan = models.ForeignKey(
        Plan,
        on_delete=models.PROTECT,
        related_name='payments',
        verbose_name='Plano',
        null=True,
        blank=True
    )
    
    # Payment info
    payment_type = models.CharField(
        'Tipo',
        max_length=20,
        choices=PaymentType.choices,
        blank=True,
        default='',
        db_index=True
    )
    status = models.CharField(
        'Status',
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True
    )
    
    # Amount
    amount = models.DecimalField('Valor', max_digits=10, decimal_places=2)
    currency = models.CharField('Moeda', max_length=3, default='BRL')
    
    # Mercado Pago
    mp_payment_id = models.CharField(
        'MP Payment ID',
        max_length=100,
        unique=True,
        db_index=True
    )
    mp_preference_id = models.CharField('MP Preference ID', max_length=100, blank=True)
    mp_status = models.CharField('MP Status', max_length=50, blank=True)
    mp_status_detail = models.CharField('MP Status Detail', max_length=100, blank=True)
    
    # Payer info (from purchase)
    payer_email = models.EmailField('E-mail do pagador', blank=True)
    payer_name = models.CharField('Nome do pagador', max_length=200, blank=True)
    
    # Metadata
    metadata = models.JSONField('Metadata', default=dict, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField('Criado em', auto_now_add=True)
    updated_at = models.DateTimeField('Atualizado em', auto_now=True)
    paid_at = models.DateTimeField('Pago em', null=True, blank=True)
    
    class Meta:
        verbose_name = 'Pagamento'
        verbose_name_plural = 'Pagamentos'
        ordering = ['-created_at']
    
    def __str__(self):
        return f'{self.mp_payment_id} - {self.amount} {self.currency}'


class UsageRecord(models.Model):
    """Track usage for metered features (AI requests, etc.)."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='usage_records',
        verbose_name='Usuário'
    )
    
    # Usage info
    feature = models.CharField('Feature', max_length=50, db_index=True)
    date = models.DateField('Data', db_index=True)
    count = models.IntegerField('Contagem', default=0)
    
    # Timestamps
    created_at = models.DateTimeField('Criado em', auto_now_add=True)
    updated_at = models.DateTimeField('Atualizado em', auto_now=True)
    
    class Meta:
        verbose_name = 'Registro de Uso'
        verbose_name_plural = 'Registros de Uso'
        unique_together = ['user', 'feature', 'date']
        ordering = ['-date']
    
    def __str__(self):
        return f'{self.user.email} - {self.feature} - {self.date}: {self.count}'
