# Guia Completo de Testes Manuais — Acorda System

> Documento gerado a partir da análise exaustiva do código-fonte do frontend (`acorda/src/`).
> Para cada formulário/dialog, estão documentados: campos exatos, tipos, opções, defaults, validações e comportamentos especiais.

---

## Sumário

1. [Autenticação](#1-autenticação)
2. [Onboarding](#2-onboarding)
3. [Quick Capture e Inbox](#3-quick-capture-e-inbox)
4. [Tarefas](#4-tarefas)
5. [Metas / OKRs](#5-metas--okrs)
6. [Hábitos](#6-hábitos)
7. [Pomodoro](#7-pomodoro)
8. [Calendário](#8-calendário)
9. [Projetos](#9-projetos)
10. [Finanças](#10-finanças)
11. [Treino](#11-treino)
12. [Leitura](#12-leitura)
13. [Estudos](#13-estudos)
14. [Bem-estar](#14-bem-estar)
15. [Dieta](#15-dieta)
16. [Perfil e Configurações](#16-perfil-e-configurações)
17. [Integrações e Privacidade](#17-integrações-e-privacidade)

---

## 1. Autenticação

### 1.1 Login (`LoginScreen.tsx`)

| Campo | Tipo | Label | Placeholder | Obrigatório | Validação |
|-------|------|-------|-------------|-------------|-----------|
| email | `<Input type="email">` | Email | — | Sim | HTML email | 
| password | `<Input type="password">` | Senha | — | Sim | — |

**Comportamentos especiais:**
- Botão "Entrar" desabilitado durante `isLoading`
- Link "Esqueci minha senha" navega para tela de recuperação
- Erro da API exibido em `<Alert variant="destructive">`
- Toggle para mostrar/ocultar senha (ícone olho)

---

### 1.2 Esqueci Minha Senha (`ForgotPasswordScreen.tsx`)

| Campo | Tipo | Label | Placeholder | Obrigatório | Validação |
|-------|------|-------|-------------|-------------|-----------|
| email | `<Input type="email">` | E-mail | — | Sim | HTML email |

**Comportamentos especiais:**
- Após submit, mostra mensagem de sucesso **sempre** (previne enumeração de contas)
- Mensagem: "Se existe uma conta com este e-mail, enviaremos instruções..."
- Link "Voltar para login"

---

### 1.3 Redefinir Senha (`ResetPasswordScreen.tsx`)

| Campo | Tipo | Label | Placeholder | Obrigatório | Validação |
|-------|------|-------|-------------|-------------|-----------|
| password | `<Input type="password">` | Nova senha | — | Sim | Mínimo 8 caracteres |
| confirmPassword | `<Input type="password">` | Confirmar nova senha | — | Sim | Deve ser igual à senha |

**Comportamentos especiais:**
- Token extraído de query param `?token=...`
- Indicadores visuais de validação em tempo real (check marks):
  - ✓ Pelo menos 8 caracteres
  - ✓ Senhas coincidem
- Botão desabilitado se: `password.length < 8 || password !== confirmPassword`
- Sucesso redireciona para login após mensagem
- Se token inválido/expirado, mostra erro

---

### 1.4 Ativar Conta (`ActivateAccountScreen.tsx`)

| Campo | Tipo | Label | Placeholder | Obrigatório | Validação |
|-------|------|-------|-------------|-------------|-----------|
| name | `<Input type="text">` | Seu nome | — | Não | — |
| password | `<Input type="password">` | Senha | — | Sim | Mínimo 8 caracteres |
| confirmPassword | `<Input type="password">` | Confirmar senha | — | Sim | Deve ser igual |

**Comportamentos especiais:**
- Token extraído de query param `?token=...`
- Indicadores visuais em tempo real (mesma lógica do reset)
- Sucesso redireciona para login

---

## 2. Onboarding

Fluxo de 6 passos: `welcome → goal → habits → tour → modules → ready`  
Barra de progresso no topo com "Passo X de 6" e botão **"Pular setup"** disponível em todas as telas.

### 2.1 WelcomeStep

- **Nenhum campo de input**
- Exibe saudação personalizada: "Olá, {userName}! 👋"
- 3 destaques de funcionalidade (read-only)
- Botão: **"Começar Setup"**

### 2.2 GoalStep — Fase 1 (Objetivo)

| Campo | Tipo | Label | Placeholder | Obrigatório | Validação |
|-------|------|-------|-------------|-------------|-----------|
| objective | `<Input>` | Objetivo | "Ex: Melhorar minha saúde física" | Sim (para avançar) | `trim().length > 0` |
| description | `<Textarea>` | Por quê? (opcional) | "O que te motiva a atingir essa meta?" | Não | — |

**Sugestões clicáveis (Badges):**
- "Melhorar minha saúde física"
- "Organizar minhas finanças"
- "Desenvolver minha carreira"
- "Ler mais livros"
- "Aprender algo novo"
- "Cuidar da saúde mental"

Ao clicar, preenche `objective` e `description` automaticamente.

### 2.3 GoalStep — Fase 2 (Key Results)

| Campo | Tipo | Placeholder | Obrigatório | Validação |
|-------|------|-------------|-------------|-----------|
| KR 1 | `<Input>` | "Ex: Exercitar 3x por semana" | Não | — |
| KR 2 | `<Input>` | "Ex: Perder 5kg em 3 meses" | Não | — |
| KR 3-5 | `<Input>` | — | Não | Máximo 5 |

- Mínimo 1 input, máximo 5 (botão "Adicionar Key Result")
- Se nenhum KR preenchido, cria KR genérico "Completar objetivo principal"
- Deadline automático: 90 dias a partir de agora
- Botões: **Voltar** / **Criar Meta**
- Pode **Pular** toda a etapa

### 2.4 HabitsStep

- **Nenhum campo de texto** — seleção por cards
- Grid 2 colunas com HABIT_SUGGESTIONS (10 opções pré-definidas):

| ID | Título | Emoji | Cadência |
|----|--------|-------|----------|
| water-daily | Beber água | 💧 | daily |
| walk-daily | Caminhada 10 min | 🚶 | daily |
| meditate-daily | Meditar 5 min | 🧘 | daily |
| read-daily | Ler 10 min | 📖 | daily |
| journal-daily | Diário 2 min | ✍️ | daily |
| stretch-daily | Alongar | 🧘‍♂️ | daily |
| sleep-early-daily | Dormir cedo | 🌙 | daily |
| organize-daily | Organizar 10 min | 🧹 | daily |
| gratitude-daily | Gratidão | 🙏 | daily |
| exercise-weekly | Exercício | 💪 | weekly |

- Toggle selection (toque para selecionar/deselecionar)
- Contador: "{N} hábito(s) selecionado(s)"
- Botão submit desabilitado se `selectedIds.size === 0`
- Pode **Pular**

### 2.5 GuidedTourStep

- **Nenhum campo de input** — carrossel de 3 slides informativos
- Slide 1: **Captura Rápida** — presenta botão "+"
- Slide 2: **Inbox — Seu Ponto de Entrada** — apresenta aba Planejar
- Slide 3: **Tarefas & Prioridades** — apresenta aba Hoje
- Navegação: dots indicador + **Próximo** / **Concluir Tour**

### 2.6 ModulesStep

| Módulo | ID | Default | Descrição |
|--------|----|---------|-----------|
| Finanças | `financas` | `false` | Controle receitas, despesas e orçamento |
| Leitura / PDF | `leitura` | `false` | Lista de livros, progresso, highlights PDF |
| Estudos | `estudos` | `false` | Matérias, revisão espaçada, auto-teste |
| Bem-estar | `bemestar` | `false` | Humor, sono, energia, programas |
| Treino | `treino` | `false` | Planos, séries, evolução |
| Dieta | `dieta` | `false` | Refeições, templates, alimentação |

- Cada módulo é um card clicável com `<Switch>` toggle
- Módulo `integracoes` iniciado como `false` (não aparece no UI)
- Contador: "{N} módulo(s) selecionado(s)" ou "Nenhum módulo selecionado"
- Botão: **Continuar** (sempre habilitado, aceita 0 módulos)

### 2.7 ReadyStep

- **Nenhum campo de input** — tela de confirmação
- Resumo: "{N} meta(s) criada(s)", "{N} hábito(s) adicionado(s)"
- Dicas de próximos passos (read-only)
- Botão: **"Começar a usar o Acorda"**

---

## 3. Quick Capture e Inbox

### 3.1 Quick Capture (`QuickCapture.tsx`)

Componente: `<Sheet>` (slide-up bottom sheet) acionado pelo FAB "+"

| Campo | Tipo | Label/Placeholder | Obrigatório | Validação |
|-------|------|--------------------|-------------|-----------|
| content | `<Input>` | "O que está na sua mente?" | Sim | `trim().length > 0` |
| notes | `<Textarea>` | "Adicione detalhes, contexto ou links..." | Não | — |

**Comportamentos especiais:**
- Campo de notas oculto por padrão; aparece ao clicar "Adicionar notas"
- Botão: **"Adicionar à Inbox"**
- Após salvar, limpa os campos e fecha o sheet
- Toast de sucesso: "Adicionado à inbox"

### 3.2 Processar Inbox (`ProcessInboxDialog.tsx`)

Dialog multi-step GTD para processar itens da Inbox. Suporte a processamento em lote (mostra "Item X/Y").

#### Step 1 — "É acionável?"

| Campo | Tipo | Opções | Default |
|-------|------|--------|---------|
| actionable | `<RadioGroup>` | Sim / Não | — (nenhum) |

Se **Não** → salva como Referência:

| Campo | Tipo | Placeholder | Obrigatório |
|-------|------|-------------|-------------|
| referenceTitle | `<Input>` | "Título da referência" | Sim |
| tags | `<Input>` | "Separe por vírgula" | Não |

#### Step 2 — "Ação"

| Campo | Tipo | Placeholder | Obrigatório |
|-------|------|-------------|-------------|
| taskTitle | `<Input>` (pré-preenchido com conteúdo do inbox) | — | Sim |
| nextAction | `<Input>` | "Qual é a próxima ação concreta?" | Não |

#### Step 3 — "Destino"

| Campo | Tipo | Opções |
|-------|------|--------|
| destination | `<RadioGroup>` | Próxima Ação (`next`), Agendada (`scheduled`), Aguardando (`waiting`), Algum Dia (`someday`), Fazer agora – 2min (`done`) |

Se **Agendada** → campos adicionais:

| Campo | Tipo | Opções/Range | Default |
|-------|------|-------------|---------|
| Calendar | `<Calendar>` | A partir de hoje | Hoje |
| startHour | `<Select>` | 6–23 | 8 |
| startMin | `<Input number>` | 0–59 | 0 |
| durationHours | `<Input number>` | 0–12 | 1 |
| durationMins | `<Input number>` | 0–59 | 0 |

#### Step 4 — "Detalhes"

| Campo | Tipo | Opções | Default |
|-------|------|--------|---------|
| energyLevel | `<Select>` | Baixa / Média / Alta | medium |
| estimateMin | `<Input number>` | — | — |
| projectId | `<Select>` | Projetos ativos | — (Nenhum) |
| keyResultId | `<Select>` | KRs ativos | — (Nenhum) |
| tags | `<Input>` | "Separe por vírgula" | — |

**Comportamentos especiais:**
- Barra de progresso por steps
- Em lote: botão "Próximo Item" após salvar
- Botão "Descartar" disponível

---

## 4. Tarefas

### 4.1 TaskDialog (`TaskDialog.tsx`)

| Campo | Tipo | Label | Placeholder/Opções | Default | Obrigatório | Validação |
|-------|------|-------|---------------------|---------|-------------|-----------|
| title | `<Input>` | Título | "O que precisa ser feito?" | — | Sim | `trim().length > 0` |
| description | `<Textarea>` | Descrição | — | — | Não | — |
| status | `<Select>` | Status | Próxima Ação (`next`), Agendada (`scheduled`), Aguardando (`waiting`), Algum Dia (`someday`) | `next` | — | — |
| scheduledDate | `<Calendar>` | Data agendada | (só aparece se status=`scheduled`) | Hoje | — | — |
| energyLevel | `<Select>` | Energia | Baixa (`low`), Média (`medium`), Alta (`high`) | `medium` | — | — |
| estimateMin | `<Input number>` | Estimativa (min) | min=1, max=480 | — | Não | 1–480 |
| projectId | `<Select>` | Projeto | Projetos ativos + "Nenhum" | — | Não | — |
| tags | `<Input>` | Tags | "Separe por vírgula" | — | Não | — |
| keyResultId | `<Select>` | Vincular a resultado-chave | KRs ativos + "Nenhum" | — | Não | — |
| notes | `<Textarea>` | Notas | — | — | Não | — |
| priority | `<Button toggle>` (ícone Star) | "Marcar como prioridade" / "Prioridade Alta" | — | `false` | — | — |

**Comportamentos especiais:**
- Ao editar tarefa existente, pré-preenche todos os campos
- Toggle de prioridade muda cor do ícone estrela
- Calendário aparece condicionalmente (só se `status === 'scheduled'`)
- Tags convertidas: string separada por vírgula → array
- Botão "Salvar" / "Criar" dependendo do modo

### 4.2 ScheduleTaskDialog (`ScheduleTaskDialog.tsx`)

Agenda tarefa existente no calendário criando um bloco.

| Campo | Tipo | Opções/Range | Default |
|-------|------|-------------|---------|
| Calendar | `<Calendar>` | Sem datas passadas (`disabled: before: today`) | Hoje |
| startHour | `<Select>` | 6–23 | 8 |
| startMin | `<Input number>` | 0–59 | 0 |
| durationHours | `<Input number>` | 0–12 | calculado de `task.estimateMin` |
| durationMins | `<Input number>` | 0–59 | calculado de `task.estimateMin` |

**Comportamentos especiais:**
- Duration preenchida automaticamente a partir de `task.estimateMin` (se existir)
- Detecção de conflitos com blocos existentes: Alerta "Este horário conflita com outro bloco agendado"
- Label "Total: Xh Ymin (HH:MM – HH:MM)"
- Botão submit desabilitado se duração total ≤ 0

---

## 5. Metas / OKRs

### 5.1 GoalDialog — Nova Meta (`GoalDialog.tsx`)

| Campo | Tipo | Label | Placeholder | Obrigatório | Validação |
|-------|------|-------|-------------|-------------|-----------|
| objective | `<Input>` | Objetivo | — | Sim | `trim().length > 0` |
| description | `<Textarea>` | Descrição | — | Não | — |
| deadline | `<Calendar>` | Prazo | — | Não | — |
| KR 1..5 | `<Input>` cada | Resultado-Chave {N} | — | Min 2 | Pelo menos 2 KRs com texto |

**Comportamentos especiais:**
- Inicia com 2 inputs de KR vazios
- Botão "+" para adicionar KR (max 5)
- Botão submit desabilitado se: `objective` vazio OU menos de 2 KRs preenchidos

### 5.2 GoalEditDialog — Editar Meta (`GoalEditDialog.tsx`)

| Campo | Tipo | Label | Obrigatório | Validação |
|-------|------|-------|-------------|-----------|
| objective | `<Input>` | Objetivo | Sim | `trim().length > 0` |
| motivation | `<Textarea>` | Por que isso importa? | Não | — |
| deadline | `<Calendar>` | Prazo | Não | `min: hoje` |

**Seção Key Results (lista editável):**
- Cada KR: título editável + botão deletar
- Cada KR tem **Checkpoints** expansíveis:
  - Adicionar checkpoint: `<Input>` título
  - Toggle checkpoint como concluído
  - Remover checkpoint
- Botão "Adicionar Resultado-Chave"

### 5.3 GoalWizardDialog — Wizard 4 Passos (`GoalWizardDialog.tsx`)

| Passo | Campo | Tipo | Label | Obrigatório |
|-------|-------|------|-------|-------------|
| 1 | objective | `<Input>` | Qual é seu objetivo? | Sim |
| 2 | motivation | `<Textarea>` | Por que isso importa agora? | Não |
| 3 | deadline | `<Calendar>` | Quando quer alcançar? | Não (min: hoje) |
| 4 | KRs 1-5 | `<Input>` cada | Key Results | Min 2 preenchidos |

- Barra de progresso no topo (1/4, 2/4...)
- Cada KR pode ter Checkpoints aninhados (título text + toggle + delete)
- Botão final: "Criar Meta"

### 5.4 UpdateKRDialog — Atualizar Key Result (`UpdateKRDialog.tsx`)

| Campo | Tipo | Label | Obrigatório | Validação |
|-------|------|-------|-------------|-----------|
| currentValue | `<Input type="number">` | Valor atual | Sim | `step=0.01` |

**Comportamentos especiais:**
- Exibe descrição do KR e valor alvo (read-only)
- Progress bar visual do progresso

---

## 6. Hábitos

### 6.1 HabitDialog (`HabitDialog.tsx`)

| Campo | Tipo | Label | Placeholder/Opções | Default | Obrigatório | Validação |
|-------|------|-------|---------------------|---------|-------------|-----------|
| name | `<Input>` | Nome do Hábito | — | — | Sim | `trim().length > 0` |
| description | `<Textarea>` | Descrição | "Detalhes sobre o hábito" | — | Não | — |
| minimumVersion | `<Input>` | Versão Mínima (opcional) | "Ex: 5 minutos, 1 página" | — | Não | — |
| frequency | `<RadioGroup>` | Frequência | Diário (`daily`), Semanal (`weekly`) | `daily` | — | — |
| timesPerWeek | Botões 1-7 | Vezes por Semana | 1, 2, 3, 4, 5, 6, 7 | 3 | — | Só aparece se `weekly` |
| targetDays | Toggle buttons | Dias Específicos (opcional) | Dom, Seg, Ter, Qua, Qui, Sex, Sáb | `[]` | Não | Só aparece se `weekly` |
| keyResultId | `<Select>` | Vincular a Key Result (opcional) | KRs ativos + "Nenhum" | — | Não | Só aparece se há KRs |
| preferredTime | `<Select>` | Horário preferido | Manhã (`morning`), Tarde (`afternoon`), Noite (`evening`), Qualquer (`anytime`) | `anytime` | — | — |

**Comportamentos especiais:**
- Ao criar (sem `habit` prop), exibe **HabitSuggestions** — cards rápidos com hábitos pré-definidos
- Weekdays labels: Dom(0), Seg(1), Ter(2), Qua(3), Qui(4), Sex(5), Sáb(6)
- Campos condicionais: `timesPerWeek` e `targetDays` só aparecem quando `frequency === 'weekly'`

---

## 7. Pomodoro

### 7.1 PomodoroDialog (`PomodoroDialog.tsx`)

**Presets padrão:**
| Nome | Foco | Pausa | Pausa Longa |
|------|------|-------|-------------|
| 25/5 (Clássico) | 25 min | 5 min | 15 min |
| 50/10 (Profundo) | 50 min | 10 min | 20 min |
| 15/3 (Rápido) | 15 min | 3 min | 10 min |

| Campo | Tipo | Label | Opções |
|-------|------|-------|--------|
| preset | `<Select>` | Preset | Defaults + presets do usuário |
| taskId | `<Select>` | Tarefa | Tarefas ativas (não-done) + "Sem tarefa vinculada" |

**Controles do Timer:**
- ▶️ Play / ⏸️ Pause / ⏹️ Stop / ⏭️ Skip (avança para próxima fase)
- Fases: focus → break → focus → ... → longBreak (após N ciclos)
- Botão **"Interrupção"** — registra interrupção durante foco
- Após completar sessão: campo **Notas da sessão** (`<Textarea>`)

### 7.2 PomodoroPresetDialog (`PomodoroPresetDialog.tsx`)

| Campo | Tipo | Label | Default | Obrigatório | Validação |
|-------|------|-------|---------|-------------|-----------|
| name | `<Input>` | Nome | — | Sim | `trim().length > 0` |
| focusDuration | `<Input type="number">` | Foco (min) | 25 | Sim | `min=1` |
| breakDuration | `<Input type="number">` | Pausa (min) | 5 | Sim | `min=1` |
| longBreakDuration | `<Input type="number">` | Pausa longa (min) | 15 | Sim | `min=1` |
| cyclesBeforeLongBreak | `<Input type="number">` | Ciclos até pausa longa | 4 | Sim | `min=1` |

---

## 8. Calendário

### 8.1 CalendarBlockDialog (`CalendarBlockDialog.tsx`)

| Campo | Tipo | Label | Placeholder/Opções | Default | Obrigatório | Validação |
|-------|------|-------|---------------------|---------|-------------|-----------|
| linkedTaskId | `<Select>` | Vincular tarefa (opcional) | Tarefas disponíveis + "Nenhuma tarefa" | — | Não | — |
| linkedHabitId | `<Select>` | Vincular hábito (opcional) | Hábitos ativos + "Nenhum hábito" | — | Não | Só aparece se há hábitos |
| title | `<Input>` | Título | "O que você vai fazer?" | — | Sim | `trim().length > 0` |
| description | `<Textarea>` | Descrição (opcional) | "Detalhes adicionais" | — | Não | — |
| type | `<Select>` | Tipo | Tarefa (`task`), Hábito (`habit`), Foco (`focus`), Reunião (`meeting`), Pessoal (`personal`) | `task` | — | — |
| calendarDate | `<Calendar>` | Data | — | Data selecionada ou hoje | — | — |
| startHour | `<Select>` | Hora início | 6–23 | 8 | — | — |
| startMin | `<Input number>` | Minutos início | 0–59 | 0 | — | — |
| durationHours | `<Input number>` | Duração (horas) | 0–12 | 1 | — | — |
| durationMins | `<Input number>` | Duração (minutos) | 0–59 | 0 | — | — |

**Comportamentos especiais:**
- Ao vincular **tarefa**: auto-preenche título e duração (se tarefa tem `estimateMin`)
- Ao vincular **hábito**: auto-preenche título com nome do hábito
- **Alerta de conflito**: "Este horário conflita com outro bloco agendado" (Warning amarelo)
- Label de duração total: "Total: 1h 30min (08:00 – 09:30)"
- Botão submit desabilitado se: título vazio OU duração total ≤ 0
- Em modo edição: botão **"Excluir"** com `AlertDialog` de confirmação
  - Ao excluir bloco vinculado a tarefa: reverte status da tarefa para `next`

---

## 9. Projetos

### 9.1 ProjectDialog (`ProjectDialog.tsx`)

| Campo | Tipo | Label | Placeholder/Opções | Default | Obrigatório | Validação |
|-------|------|-------|---------------------|---------|-------------|-----------|
| name | `<Input>` | Nome | — | — | Sim | `trim().length > 0` |
| description | `<Textarea>` | Descrição | — | — | Não | — |
| status | `<Select>` | Status | Ativo (`active`), Concluído (`completed`), Arquivado (`archived`) | `active` | — | — |
| deadline | `<Calendar>` | Prazo | — | — | Não | — |
| tags | `<Input>` | Tags | "Separe por vírgula" | — | Não | — |

---

## 10. Finanças

### 10.1 Nova Receita (`TransactionsTab.tsx`)

| Campo | Tipo | Label | Obrigatório | Validação |
|-------|------|-------|-------------|-----------|
| description | `<Input>` | Descrição | Sim | `trim().length > 0` |
| amount | `<CurrencyInput>` | Valor | Sim | `> 0` |
| date | `<Calendar>` | Data | — | Default: hoje |
| accountId | `<Select>` | Conta | Sim | Deve ter conta |
| categoryId | `<Select>` | Categoria | Não | Filtra por `type='income'` |

### 10.2 Nova Despesa (`TransactionsTab.tsx`)

Mesma estrutura da Receita, mas `categoryId` filtra por `type='expense'`.

### 10.3 Receita Fixa (`IncomeExpensesTab.tsx`)

| Campo | Tipo | Label | Opções | Default | Obrigatório | Validação |
|-------|------|-------|--------|---------|-------------|-----------|
| name | `<Input>` | Nome | — | — | Sim | `trim().length > 0` |
| amount | `<CurrencyInput>` | Valor | — | — | Sim | `> 0` |
| accountId | `<Select>` | Conta | Contas do usuário | — | Sim | — |
| frequency | `<Select>` | Frequência | Mensal (`monthly`), Semanal (`weekly`), Quinzenal (`biweekly`), Anual (`yearly`), Diário (`daily`) | `monthly` | — | — |
| dayOfMonth | `<Input number>` | Dia do mês | — | — | Não | — |
| autoConfirm | `<Switch>` | Lançar automaticamente | — | `false` | — | — |

### 10.4 Despesa Fixa (`IncomeExpensesTab.tsx`)

Mesma estrutura de Receita Fixa + campo adicional:

| Campo | Tipo | Label | Obrigatório |
|-------|------|-------|-------------|
| categoryId | `<Select>` | Categoria | Sim (filtra `type='expense'`) |

### 10.5 Nova Categoria (`SettingsTab.tsx`)

| Campo | Tipo | Label | Opções | Obrigatório |
|-------|------|-------|--------|-------------|
| name | `<Input>` | Nome | — | Sim |
| type | `<Select>` | Tipo | Despesa (`expense`), Receita (`income`) | Sim |

### 10.6 Nova Conta (`SettingsTab.tsx`)

| Campo | Tipo | Label | Opções | Default | Obrigatório |
|-------|------|-------|--------|---------|-------------|
| name | `<Input>` | Nome | — | — | Sim |
| type | `<Select>` | Tipo | Conta Corrente (`checking`), Dinheiro (`cash`), Cartão de Crédito (`credit`), Poupança (`savings`), Investimento (`investment`) | — | Sim |
| balance | `<CurrencyInput>` | Saldo Inicial | — | 0 | — |

### 10.7 Chat Input — IA Financeira (`ChatInput.tsx`)

| Campo | Tipo | Placeholder | Tecnologia |
|-------|------|-------------|------------|
| input | `<Input>` | "Ex: comprei um café por 8 reais" | `spark.llm` para parsing |
| voice | Botão microfone | — | Web Speech API (`pt-BR`) |

**Comportamentos especiais:**
- Input em linguagem natural
- IA analisa e sugere: descrição, valor, tipo (income/expense), categoria
- Card de confirmação com preview da transação: **Salvar** / **Editar** / **Cancelar**
- Botão microfone: ativa reconhecimento de voz do navegador
  - Status visual: "Ouvindo..." (icon pulsando)
  - Texto reconhecido preenche o input automaticamente
- Se microfone indisponível, botão fica oculto

---

## 11. Treino

### 11.1 PlanDialog — Ficha de Treino (`PlanDialog.tsx`)

| Campo | Tipo | Label | Opções | Obrigatório | Validação |
|-------|------|-------|--------|-------------|-----------|
| name | `<Input>` | Nome da Ficha | — | Sim | `trim().length > 0` |
| weekDays | `<ToggleGroup type="multiple">` | Dias da Semana | Seg, Ter, Qua, Qui, Sex, Sáb, Dom | Sim | Pelo menos 1 dia |
| notes | `<Textarea>` | Observações | — | Não | — |

### 11.2 ExerciseDialog (`ExerciseDialog.tsx`)

| Campo | Tipo | Label | Opções | Obrigatório |
|-------|------|-------|--------|-------------|
| name | `<Input>` | Nome do Exercício | — | Sim |
| muscleGroup | `<Select>` | Grupo Muscular | Peito (`chest`), Costas (`back`), Ombros (`shoulders`), Bíceps (`biceps`), Tríceps (`triceps`), Antebraço (`forearms`), Core/Abdômen (`core`), Quadríceps (`quadriceps`), Posterior (`hamstrings`), Glúteos (`glutes`), Panturrilha (`calves`), Corpo Inteiro (`full_body`), Cardio (`cardio`), Outro (`other`) | Sim |
| equipment | `<Select>` | Equipamento | Barra, Halteres, Máquina, Cabo, Peso corporal (exclui "Todos/all") | Não |

**Catálogo de Exercícios**: Ao abrir o dialog para novo exercício, pode selecionar de um catálogo pré-definido que auto-preenche nome, grupo muscular e equipamento.

### 11.3 SetLogDialog — Registrar Série (`SetLogDialog.tsx`)

| Campo | Tipo | Label | Default | Validação |
|-------|------|-------|---------|-----------|
| reps | `<Input type="number">` | Repetições | — | `min=0` |
| weight | `<Input type="number">` | Carga | — | `min=0, step=0.5` |
| unit | `<Select>` | Unidade | `kg` | `kg` / `lb` |
| isWarmup | `<Switch>` | Aquecimento | `false` | — |

### 11.4 ExercisePrescriptionDialog (`ExercisePrescriptionDialog.tsx`)

**Presets rápidos (botões):** `3×15`, `3×12`, `3×8`, `4×15`, `4×12`, `4×8`, `3×8-12`, `4×8-12`

| Campo | Tipo | Label | Validação |
|-------|------|-------|-----------|
| sets | `<Input number>` | Séries | `min=1` |
| repsMin | `<Input number>` | Reps (mín) | `min=1` |
| repsMax | `<Input number>` | Reps (máx) | Só no modo range |
| rangeMode | Toggle | Range | Alterna entre reps fixas e range |
| note | `<Input>` | Observação | — |

**Modo Estrutura (warmup/feeder/work):**
- Lista de sets individuais com tipo: Aquecimento / Feeder / Work
- Cada set: peso/reps configuráveis

**Técnicas Avançadas:**

| Técnica | Parâmetros |
|---------|------------|
| Backoff Set | `backoffPercent` (% de redução) |
| Rest-pause | `restSeconds` (segundos de descanso) |
| Pulse Set | — |
| Widowmaker 20 reps | — |
| Bi-set/Superset | `linkedPlanItemId` (exercício vinculado) |
| Custom | `customNote` (texto livre) |

---

## 12. Leitura

### 12.1 BookDialog — Livro (`BookDialog.tsx`)

| Campo | Tipo | Label | Default | Obrigatório | Validação |
|-------|------|-------|---------|-------------|-----------|
| title | `<Input>` | Título | — | Sim | `trim().length > 0` |
| author | `<Input>` | Autor | — | Sim | `trim().length > 0` |
| totalPages | `<Input type="number">` | Total de Páginas | — | Sim | `min=0, max=99999` |
| startDate | `<Calendar>` | Data de Início | Hoje | Sim | — |
| targetDate | `<Calendar>` | Meta de Conclusão | — | Sim | — |
| notes | `<Textarea>` | Notas | — | Não | — |

**Comportamentos especiais:**
- Em modo edição: botão **"Excluir livro"** com confirmação "Deseja realmente excluir?"
- Ao excluir: `AlertDialog` com Cancelar/Excluir

### 12.2 UpdateProgressDialog (`UpdateProgressDialog.tsx`)

| Campo | Tipo | Label | Default | Validação |
|-------|------|-------|---------|-----------|
| currentPage | `<Input type="number">` | Página Atual | Última página registrada | `min=0, max=totalPages` |
| notes | `<Textarea>` | Notas | — | — |

**Comportamentos especiais:**
- Auto-calcula "páginas lidas nesta sessão"
- Exibe barra de progresso visual

---

## 13. Estudos

### 13.1 StudySessionDialog (`StudySessionDialog.tsx`)

| Campo | Tipo | Label | Opções | Default | Obrigatório |
|-------|------|-------|--------|---------|-------------|
| subjectId | `<Select>` | Assunto | Matérias do usuário + "Adicionar nova matéria" | — | Sim |
| notes | `<Textarea>` | Notas rápidas | — | — | Não |
| durationMin | `<Input number>` | Duração (minutos) | — | — | Sim (só modo manual) |
| scheduleReviews | `<Switch>` | Agendar revisões | — | `true` | — |

**Dois modos:**
1. **Timer**: Play/Pause/Stop/Complete — mede tempo real
2. **Manual**: Input de duração em minutos

**Revisão Espaçada automática:** D+1, D+3, D+7, D+14

### 13.2 ConsentDialog (`ConsentDialog.tsx`)

Consentimento para transcrição de áudio.

| Campo | Tipo | Texto |
|-------|------|-------|
| checkbox 1 | `<Checkbox>` | "Entendo que a transcrição do áudio será processada..." |
| checkbox 2 | `<Checkbox>` | "Concordo com o processamento dos dados..." |

- **Ambos obrigatórios** para habilitar botão "Concordo e Continuar"
- Botão alternativo: "Não Concordo"

### 13.3 SelfTestDialog — Auto-Teste (`SelfTestDialog.tsx`)

| Campo | Tipo | Quantidade | Obrigatório |
|-------|------|------------|-------------|
| question 1-5 | `<Input>` cada | Mínimo 3, máximo 5 | Min 3 preenchidos |

**Comportamentos especiais:**
- Inicia com 3 inputs
- Botão "+" para adicionar (max 5)
- Botão "×" para remover (min 3)
- Botão **"Pular"** disponível
- Botão **"Salvar"** desabilitado se < 3 preenchidas

---

## 14. Bem-estar

### 14.1 CheckInDialog (`CheckInDialog.tsx`)

| Campo | Tipo | Label | Opções | Default |
|-------|------|-------|--------|---------|
| sleepHours | `<Slider>` | Horas de sono | 0–12, step 0.5 | 7 |
| energyLevel | 3 botões | Nível de energia | Baixo (`low`), Médio (`medium`), Alto (`high`) | `medium` |
| mood | 3 botões | Humor | Baixo (`low`), Médio (`medium`), Alto (`high`) | `medium` |
| notes | `<Textarea>` | Notas | — | — |

**Comportamentos especiais:**
- Slider visual com label dinâmico: "7h de sono"
- Botões são toggles visuais com ícones/emojis

### 14.2 WellnessProgramDialog (`WellnessProgramDialog.tsx`)

| Campo | Tipo | Label | Opções |
|-------|------|-------|--------|
| type | `<Select>` | Tipo de Programa | Rotina de Sono (`sleep`, ícone Moon), Redução de Tela (`screen_time`, ícone DeviceMobile), Rotina Matinal (`morning_routine`, ícone SunHorizon), Foco e Concentração (`focus`, ícone Target) |
| duration | 3 botões | Duração | 7 dias, 14 dias, 30 dias |

**Descrições dos programas (read-only):**
- sleep: "Melhore a qualidade do seu sono com hábitos saudáveis"
- screen_time: "Diminua o tempo em dispositivos e recupere seu foco"
- morning_routine: "Comece o dia com energia e propósito"
- focus: "Desenvolva habilidades de foco profundo"

---

## 15. Dieta

### 15.1 MealTemplateDialog — Template de Refeição (`MealTemplateDialog.tsx`)

| Campo | Tipo | Label | Opções | Default | Obrigatório |
|-------|------|-------|--------|---------|-------------|
| name | `<Input>` | Nome | — | — | Sim |
| defaultTime | `<Input type="time">` | Horário padrão | — | `12:00` | — |
| frequency | `<Select>` | Frequência | Manual (`manual`), Diário (`daily`), Dias úteis (`weekdays`), Fins de semana (`weekends`), Personalizado (`custom`) | `manual` | — |
| weekDays | Toggle buttons (Dom-Sáb) | Dias da semana | 0-6 | — | Só aparece se `custom` |

**Alimentos (lista dinâmica):**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| nome | `<Input>` | Sim |
| quantidade | `<Input number>` | — (step=0.1) |
| unidade | `<Input>` | — |

**Quick-picks de nome/horário:**

| Nome | Horário |
|------|---------|
| Café da manhã | 07:30 |
| Lanche da manhã | 10:00 |
| Almoço | 12:30 |
| Lanche da tarde | 15:30 |
| Jantar | 19:30 |
| Ceia | 21:30 |

### 15.2 MealDialog — Refeição do Dia (`MealDialog.tsx`)

| Campo | Tipo | Label | Default | Obrigatório |
|-------|------|-------|---------|-------------|
| name | `<Input>` | Nome da refeição | — | Sim |
| time | `<Input type="time">` | Horário | `12:00` | — |
| foods | Lista dinâmica | Alimentos | — | — |
| notes | `<Textarea>` | Notas | — | Não |

Cada alimento: `nome (text)`, `quantidade (number, step=0.1)`, `unidade (text)`.

**Comportamentos especiais:**
- Em edição: botão **"Excluir"** com confirmação `AlertDialog`
- Botão "+" para adicionar alimento à lista

---

## 16. Perfil e Configurações

### 16.1 ProfileDialog (`ProfileDialog.tsx`)

| Campo | Tipo | Label | Validação |
|-------|------|-------|-----------|
| avatar | `<Input type="file">` | Foto de Perfil | Apenas imagens, max 5MB |
| name | `<Input>` | Nome | Obrigatório, `trim().length > 0` |
| email | `<Input>` (disabled) | Email | Read-only |

**Seção "Alterar Senha":**

| Campo | Tipo | Label | Validação |
|-------|------|-------|-----------|
| currentPassword | `<Input type="password">` | Senha atual | Obrigatório para alterar |
| newPassword | `<Input type="password">` | Nova senha | Min 8 caracteres |
| confirmNewPassword | `<Input type="password">` | Confirmar nova senha | Deve ser igual |

**Comportamentos especiais:**
- Avatar: preview da imagem, botão de deletar avatar
- Upload com `FormData` para API 
- Seção de senha só valida se todos os 3 campos estiverem preenchidos
- Email é readonly/disabled

### 16.2 SettingsDialog (`SettingsDialog.tsx`)

| Campo | Tipo | Label | Opções | Default |
|-------|------|-------|--------|---------|
| darkMode | `<Switch>` | Modo escuro | on/off | Atual |
| weekStartsOn | `<Select>` | Início da semana | Domingo (`0`), Segunda-feira (`1`) | `0` |

### 16.3 ModulesDialog (`ModulesDialog.tsx`)

| Módulo | Toggle |
|--------|--------|
| Finanças (`financas`) | `<Switch>` |
| Leitura/PDF (`leitura`) | `<Switch>` |
| Estudos (`estudos`) | `<Switch>` |
| Bem-estar (`bemestar`) | `<Switch>` |
| Treino (`treino`) | `<Switch>` |
| Dieta (`dieta`) | `<Switch>` |

### 16.4 ExportDialog (`ExportDialog.tsx`)

| Campo | Tipo | Label | Default |
|-------|------|-------|---------|
| exportTasks | `<Checkbox>` | Tarefas e projetos | `true` |
| exportHabits | `<Checkbox>` | Hábitos e registros | `true` |
| exportGoals | `<Checkbox>` | Metas e Key Results | `true` |

**Comportamentos especiais:**
- Formato fixo: **Markdown** (`.md`)
- Botão "Exportar" baixa arquivo `.md` com dados selecionados
- Botão desabilitado se nenhum checkbox marcado

### 16.5 NoteDialog (`NoteDialog.tsx`)

| Campo | Tipo | Label | Placeholder | Default | Obrigatório |
|-------|------|-------|-------------|---------|-------------|
| title | `<Input>` | Título | — | "Sem título" | — |
| content | `<Textarea rows=8>` | Conteúdo | — | — | — |
| tags | `<Input>` | Tags | "Separe por vírgula" | — | Não |
| sourceUrl | `<Input type="url">` | URL de origem | — | — | Não |

---

## 17. Integrações e Privacidade

### 17.1 IntegrationsCentral (`IntegrationsCentral.tsx`)

Duas abas: **Calendar** | **Privacidade**

#### Aba Calendar — Google Calendar (`GoogleCalendarIntegration.tsx`)

**Não conectado:**
- Botão: **"Conectar Google Calendar"** → abre popup OAuth do Google (scope: `calendar.readonly`)

**Conectado:**
- Badge "Conectado"
- Info "Última sincronização: DD/MM/AAAA HH:MM"
- Botão: **"Sincronizar Agora"** (pega eventos do Google via backend)
- Botão: **"Desconectar"**

**Nenhum campo de formulário** — são apenas ações (botões).

#### Aba Privacidade — `PrivacySettings.tsx`

**Exportar Dados (botões):**
| Botão | Formato | Arquivo gerado |
|-------|---------|----------------|
| Exportar tudo (JSON) | JSON | `acorda-backup-completo-YYYY-MM-DD.json` |
| Exportar Finanças | CSV | `acorda-financas-YYYY-MM-DD.csv` |
| Exportar Estudos | Markdown | `acorda-estudos-YYYY-MM-DD.md` |
| Exportar Leitura | Markdown | `acorda-leitura-YYYY-MM-DD.md` |

**Zona de Perigo — Apagar Dados:**

| Campo | Tipo | Label | Validação |
|-------|------|-------|-----------|
| confirmText | `<Input>` | "Digite APAGAR para confirmar" | Deve ser exatamente `"APAGAR"` |

- Botão **"Apagar Todos os Meus Dados"** abre dialog de confirmação
- Descrição: "Esta ação apagará permanentemente todos os seus dados do sistema..."
- Botão **"Apagar Permanentemente"** desabilitado até confirmar
- Botão **"Cancelar"** fecha dialog e limpa campo

### 17.2 PrivacyDialog (`PrivacyDialog.tsx`)

Dialog alternativo (acessado de outro ponto) com mesma funcionalidade de exclusão:

| Campo | Tipo | Validação |
|-------|------|-----------|
| confirmText | `<Input>` | Deve ser exatamente `"APAGAR"` |

- Lista "O que armazenamos" (read-only)
- Seção "Zona de perigo" com mesmo fluxo de confirmação

---

## Tipos Fundamentais (Reference)

Definidos em `lib/types.ts`:

```
TaskStatus:      'inbox' | 'next' | 'scheduled' | 'waiting' | 'someday' | 'done'
EnergyLevel:     'low' | 'medium' | 'high'
ProjectStatus:   'active' | 'archived' | 'completed'
CalendarBlockType: 'task' | 'habit' | 'focus' | 'meeting' | 'personal'
HabitFrequency:  'daily' | 'weekly'
ModuleType:      'financas' | 'leitura' | 'estudos' | 'bemestar' | 'treino' | 'integracoes' | 'dieta'
Appearance:      'light' | 'dark'
TransactionType: 'income' | 'expense' | 'transfer'
IncomeType:      'fixed' | 'variable'
RecurrenceFrequency: 'daily' | 'monthly' | 'weekly' | 'biweekly' | 'yearly'
FinanceAccount.type: 'cash' | 'checking' | 'credit' | 'savings' | 'investment'
HighlightColor:  'yellow' | 'green' | 'blue' | 'pink' | 'purple'
Book.status:     'reading' | 'completed' | 'paused'
MuscleGroup:     'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'forearms' | 'core' | 'quadriceps' | 'hamstrings' | 'glutes' | 'calves' | 'full_body' | 'cardio' | 'other'
WeightUnit:      'kg' | 'lb'
PrescriptionMode: 'straight' | 'range' | 'custom' | 'warmup_feeder_work'
TechniqueType:   'none' | 'backoff' | 'rest_pause' | 'pulse_set' | 'widowmaker' | 'bi_set' | 'custom'
WellnessProgramType: 'sleep' | 'screen_time' | 'morning_routine' | 'focus'
CheckInMood:     'low' | 'medium' | 'high'
DietTemplateFrequency: 'manual' | 'daily' | 'weekdays' | 'weekends' | 'custom'
WellnessProgram.duration: 7 | 14 | 30
UserSettings.weekStartsOn: 0 | 1
EquipmentType:   'Barra' | 'Halteres' | 'Máquina' | 'Cabo' | 'Peso corporal' | 'Outro'
```

---

## Componentes UI Utilizados

| Componente | Biblioteca | Uso |
|------------|-----------|-----|
| `Dialog` / `DialogContent` | shadcn/ui | Todos os diálogos modais |
| `Sheet` / `SheetContent` | shadcn/ui | Quick Capture (bottom sheet) |
| `AlertDialog` | shadcn/ui | Confirmações de exclusão |
| `Input` | shadcn/ui | Campos de texto, número, email, password, url, time |
| `Textarea` | shadcn/ui | Descrições, notas |
| `Select` / `SelectTrigger` / `SelectContent` / `SelectItem` | shadcn/ui | Dropdowns |
| `Calendar` | shadcn/ui | Seleção de data |
| `Switch` | shadcn/ui | Toggles on/off |
| `Slider` | shadcn/ui | Horas de sono |
| `RadioGroup` / `RadioGroupItem` | shadcn/ui | Escolha única (frequência, acionável) |
| `ToggleGroup` | shadcn/ui | Multi-seleção (dias da semana treino) |
| `Checkbox` | shadcn/ui | Checkboxes (consentimento, export) |
| `Badge` | shadcn/ui | Sugestões, status |
| `Progress` | shadcn/ui | Barras de progresso |
| `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent` | shadcn/ui | Abas internas |
| `CurrencyInput` | Custom | Input monetário R$ |
| `toast` (sonner) | sonner | Notificações de sucesso/erro |

---

*Documento gerado em análise completa do código-fonte. Todas as informações refletem o estado atual do codebase.*
