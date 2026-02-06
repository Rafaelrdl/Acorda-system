"""
URL routes for billing app.
"""
from django.urls import path
from .views import (
    PlansView,
    CreateCheckoutView,
    WebhookView,
    SubscriptionView,
    PaymentsView,
    UsageView,
)

urlpatterns = [
    path('plans/', PlansView.as_view(), name='plans'),
    path('checkout/', CreateCheckoutView.as_view(), name='checkout'),
    path('webhook/', WebhookView.as_view(), name='webhook'),
    path('subscription/', SubscriptionView.as_view(), name='subscription'),
    path('payments/', PaymentsView.as_view(), name='payments'),
    path('usage/', UsageView.as_view(), name='usage'),
]
