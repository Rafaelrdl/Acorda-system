"""
Mercado Pago service for payment processing.
"""
import mercadopago
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class MercadoPagoService:
    """Service for Mercado Pago API interactions."""
    
    def __init__(self):
        self.sdk = mercadopago.SDK(settings.MP_ACCESS_TOKEN)
    
    def create_checkout_preference(
        self,
        plan,
        payer_email: str,
        payer_name: str = '',
        external_reference: str = '',
    ) -> dict:
        """
        Create a checkout preference for one-time payment (Lifetime).
        Returns preference data with checkout URL.
        """
        preference_data = {
            "items": [
                {
                    "title": plan.name,
                    "description": f"Acesso vitalício ao {plan.name}",
                    "quantity": 1,
                    "currency_id": plan.currency,
                    "unit_price": float(plan.price),
                }
            ],
            "payer": {
                "email": payer_email,
                "name": payer_name,
            },
            "back_urls": {
                "success": f"{settings.FRONTEND_URL}/pagamento/sucesso",
                "failure": f"{settings.FRONTEND_URL}/pagamento/erro",
                "pending": f"{settings.FRONTEND_URL}/pagamento/pendente",
            },
            "auto_return": "approved",
            "external_reference": external_reference,
            "notification_url": f"{settings.BACKEND_URL}/api/billing/webhook/",
            "statement_descriptor": "ACORDA",
            "expires": True,
            "expiration_date_from": timezone.now().isoformat(),
            "expiration_date_to": (timezone.now() + timedelta(hours=24)).isoformat(),
        }
        
        try:
            result = self.sdk.preference().create(preference_data)
        except Exception:
            logger.exception("MP SDK error creating preference")
            return {"success": False, "error": "Erro de comunicação com o gateway de pagamento"}
        
        if result["status"] == 201:
            return {
                "success": True,
                "preference_id": result["response"]["id"],
                "init_point": result["response"]["init_point"],
                "sandbox_init_point": result["response"]["sandbox_init_point"],
            }
        else:
            logger.error(f"MP Preference creation failed: {result}")
            return {
                "success": False,
                "error": result.get("response", {}).get("message", "Unknown error"),
            }
    
    def create_subscription_preapproval(
        self,
        plan,
        payer_email: str,
        external_reference: str = '',
    ) -> dict:
        """
        Create a subscription (preapproval) for recurring payments.
        Uses redirect-based checkout (user enters card on MP page).
        """
        # Calculate frequency based on plan
        if plan.billing_cycle == 'monthly':
            frequency = 1
            frequency_type = "months"
        else:  # yearly
            frequency = 12
            frequency_type = "months"
        
        # MP rejects localhost as back_url for preapprovals.
        # Use FRONTEND_URL if it's a real domain, otherwise use a placeholder
        # that we'll handle on the frontend side.
        frontend_url = settings.FRONTEND_URL
        if 'localhost' in frontend_url or '127.0.0.1' in frontend_url:
            back_url = "https://somosacorda.com/pagamento/sucesso"
        else:
            back_url = f"{frontend_url}/pagamento/sucesso"
        
        preapproval_data = {
            "reason": plan.name,
            "auto_recurring": {
                "frequency": frequency,
                "frequency_type": frequency_type,
                "transaction_amount": float(plan.price),
                "currency_id": plan.currency,
            },
            "payer_email": payer_email,
            "back_url": back_url,
            "external_reference": external_reference,
        }
        
        # Log which MP plan this corresponds to (plan ID is used for
        # management on the MP dashboard; the redirect-based checkout flow
        # does not require preapproval_plan_id — that's for transparent checkout
        # with card tokenization on the frontend).
        if plan.mp_plan_id:
            logger.info("Creating preapproval for plan %s (mp_plan_id=%s)", plan.name, plan.mp_plan_id)
        
        try:
            result = self.sdk.preapproval().create(preapproval_data)
        except Exception:
            logger.exception("MP SDK error creating preapproval")
            return {"success": False, "error": "Erro de comunicação com o gateway de pagamento"}
        
        if result["status"] == 201:
            return {
                "success": True,
                "preapproval_id": result["response"]["id"],
                "init_point": result["response"]["init_point"],
                "sandbox_init_point": result["response"].get("sandbox_init_point", ""),
            }
        else:
            logger.error(f"MP Preapproval creation failed: {result}")
            return {
                "success": False,
                "error": result.get("response", {}).get("message", "Unknown error"),
            }
    
    def get_payment(self, payment_id: str) -> Optional[dict]:
        """Get payment details from Mercado Pago."""
        try:
            result = self.sdk.payment().get(payment_id)
        except Exception:
            logger.exception("MP SDK error getting payment %s", payment_id)
            return None
        
        if result["status"] == 200:
            return result["response"]
        else:
            logger.error(f"MP Get payment failed: {result}")
            return None
    
    def get_preapproval(self, preapproval_id: str) -> Optional[dict]:
        """Get subscription details from Mercado Pago."""
        try:
            result = self.sdk.preapproval().get(preapproval_id)
        except Exception:
            logger.exception("MP SDK error getting preapproval %s", preapproval_id)
            return None
        
        if result["status"] == 200:
            return result["response"]
        else:
            logger.error(f"MP Get preapproval failed: {result}")
            return None
    
    def cancel_subscription(self, preapproval_id: str) -> bool:
        """Cancel a subscription."""
        try:
            result = self.sdk.preapproval().update(
                preapproval_id,
                {"status": "cancelled"}
            )
        except Exception:
            logger.exception("MP SDK error cancelling subscription %s", preapproval_id)
            return False
        
        if result["status"] == 200:
            return True
        else:
            logger.error(f"MP Cancel subscription failed: {result}")
            return False
    
    def refund_payment(self, payment_id: str, amount: float | None = None) -> bool:
        """Refund a payment (full or partial)."""
        refund_data = {}
        if amount:
            refund_data["amount"] = amount
        
        try:
            result = self.sdk.refund().create(payment_id, refund_data)
        except Exception:
            logger.exception("MP SDK error refunding payment %s", payment_id)
            return False
        
        if result["status"] == 201:
            return True
        else:
            logger.error(f"MP Refund failed: {result}")
            return False


# Singleton instance
mp_service = MercadoPagoService()
