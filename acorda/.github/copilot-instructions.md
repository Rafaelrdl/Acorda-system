# Copilot Instructions - Acorda

## Visão Geral

**Acorda** é um sistema de produtividade pessoal com arquitetura monorepo:
- **Frontend** (`acorda/`): React + TypeScript + Vite + TailwindCSS + Radix UI
- **Backend** (`acorda-backend/`): Django 5 + DRF + PostgreSQL + Celery + Redis

O app combina GTD, OKR, hábitos, calendário e Pomodoro em uma interface unificada.

## Arquitetura de Dados e Sync

### Isolamento por Usuário
**CRÍTICO**: Todos os dados são isolados por `userId`. Sempre filtre por usuário:
```typescript
// ✅ CORRETO
const userTasks = tasks.filter(t => t.userId === userId)
```

### Padrão de Timestamps
Use factories de `helpers.ts` que garantem `createdAt`/`updatedAt`:
```typescript
const task = createTask(userId, "Título")          // Criar
updateTimestamp({ ...entity, campo: valor })       // Atualizar
softDelete(entity)                                 // Deletar (deleted_at)
```

### Sync Offline-First
- Frontend usa **IndexedDB** via `sync-storage.ts` (não localStorage)
- Backend aceita push/pull via `/api/sync/` com estratégia **last-write-wins**
- Mapeamento camelCase ↔ snake_case em `sync-mappers.ts`
- Entidades sincronizáveis listadas em `SYNC_ENABLED_ENTITIES`

### Modelo Base Backend
Todos os modelos herdam de `SyncableModel` (UUID, timestamps, soft-delete, sync_version).

## Autenticação

- **JWT em HttpOnly cookies** (não localStorage) - segurança contra XSS
- Frontend: `api.ts` com `credentials: 'include'` automático
- Backend: `CookieJWTAuthentication` em `apps.accounts.authentication`
- Refresh token automático em 401

## Módulos/Centrais

Sistema de feature flags por usuário em `UserSettings.modules`:
```typescript
type ModuleType = 'financas' | 'leitura' | 'estudos' | 'bemestar' | 'treino' | 'integracoes' | 'dieta'
```
Componentes em `src/components/{finance,reading,study,wellness,training,diet}/`.

## Estrutura de Componentes

```
src/
├── components/
│   ├── tabs/          # HojeTab, PlanejarTab, EvolucaoTab (3 tabs principais)
│   ├── ui/            # Componentes Radix/shadcn base
│   ├── dialogs/       # Modais (Pomodoro, Settings, etc.)
│   └── {module}/      # Centrais específicas
├── lib/
│   ├── types.ts       # Todas as interfaces TypeScript
│   ├── helpers.ts     # Factories e utilitários
│   ├── sync-storage.ts # IndexedDB + sync hooks
│   ├── sync-mappers.ts # Conversão case frontend↔backend
│   └── queries.ts     # Queries de dados comuns
```

## Comandos de Desenvolvimento

```bash
# Frontend (pasta acorda/)
npm run dev          # Vite dev server (porta 5174)
npm run test         # Vitest
npm run build        # Build produção
npx tsc --noEmit     # Type check

# Backend (pasta acorda-backend/)
python manage.py runserver  # Server Django (porta 8000)
python manage.py migrate    # Migrations
pytest                      # Testes
```

## Convenções de Código

### TypeScript/React
- Use `UserId` type (string) para IDs de usuário
- Componentes funcionais com hooks
- Estado global via `useKV` hook (sync-storage)
- Toast notifications via `sonner`

### Python/Django
- Apps em `apps/` (accounts, billing, core, sync)
- Serializers herdam `BaseSyncSerializer`
- Locale: `pt-br`, timezone: `America/Sao_Paulo`
- Senhas: Argon2

### Testes
- Frontend: `src/lib/__tests__/*.test.ts` (Vitest)
- Backend: `pytest` com `pytest-django`, factories via `factory-boy`

## Variáveis de Ambiente

Ver `.env.example` em cada pasta. Principais:
- `VITE_API_URL`: URL do backend para o frontend
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Para Celery
- `MP_ACCESS_TOKEN`: Mercado Pago (billing)
