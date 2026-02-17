# Acorda Backend

Backend Django para o app Acorda - Sistema de produtividade pessoal.

## Stack

- Django 5.0 + Django REST Framework
- PostgreSQL
- Redis + Celery (tasks assíncronas)
- Mercado Pago (pagamentos)
- JWT Authentication

## Setup Local

```bash
# Criar ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações

# Aplicar migrations
python manage.py migrate

# Criar superuser
python manage.py createsuperuser

# Rodar servidor
python manage.py runserver
```

## Variáveis de Ambiente

```
SECRET_KEY=sua-chave-secreta
DEBUG=True
DATABASE_URL=postgres://user:pass@localhost:5432/acorda
REDIS_URL=redis://localhost:6379/0

# Mercado Pago
MP_ACCESS_TOKEN=seu-token
MP_PUBLIC_KEY=sua-public-key
MP_WEBHOOK_SECRET=seu-webhook-secret

# Email
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
SENDGRID_API_KEY=sua-api-key
DEFAULT_FROM_EMAIL=noreply@somosacorda.com

# Frontend
FRONTEND_URL=http://localhost:5174
```

## Estrutura

```
acorda-backend/
├── config/              # Configurações Django
├── apps/
│   ├── accounts/        # User, Auth, Activation
│   ├── billing/         # Plans, Subscriptions, Payments
│   ├── core/            # Tasks, Habits, Goals, etc.
│   └── sync/            # Offline sync
├── templates/           # Email templates
└── manage.py
```

## API Endpoints

### Auth
- `POST /api/auth/login` - Login com email/senha
- `POST /api/auth/logout` - Logout
- `POST /api/auth/activate` - Ativar conta com token
- `POST /api/auth/forgot-password` - Solicitar reset de senha
- `POST /api/auth/reset-password` - Resetar senha com token
- `GET /api/auth/me` - Dados do usuário logado

### Billing
- `POST /api/billing/checkout` - Criar checkout Mercado Pago
- `POST /api/billing/webhook` - Webhook Mercado Pago
- `GET /api/billing/subscription` - Status da assinatura

### Sync
- `POST /api/sync/push` - Enviar mudanças locais
- `GET /api/sync/pull` - Baixar mudanças do servidor

## Planos

| Plano | Mensal | Anual | Lifetime |
|-------|--------|-------|----------|
| Pro | R$ 14,90 | R$ 149 | R$ 499 |
| Pro IA | R$ 34,90 | R$ 349 | - |
