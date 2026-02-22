# Acorda System — Catálogo Completo de Formulários

> Extraído diretamente do código-fonte em `acorda/src/`
> Todos os labels, placeholders, opções e defaults são EXATOS conforme o código.

---

## Sumário

1. [GTD — Tarefas e Inbox](#1-gtd--tarefas-e-inbox)
2. [Projetos](#2-projetos)
3. [Metas (OKR)](#3-metas-okr)
4. [Hábitos](#4-hábitos)
5. [Calendário e Pomodoro](#5-calendário-e-pomodoro)
6. [Anotações](#6-anotações)
7. [Finanças](#7-finanças)
8. [Leitura](#8-leitura)
9. [Estudos](#9-estudos)
10. [Bem-estar (Wellness)](#10-bem-estar-wellness)
11. [Treino](#11-treino)
12. [Dieta](#12-dieta)
13. [Autenticação](#13-autenticação)
14. [Perfil](#14-perfil)
15. [Configurações](#15-configurações)
16. [Privacidade](#16-privacidade)
17. [Onboarding](#17-onboarding)
18. [Exportação](#18-exportação)

---

## 1. GTD — Tarefas e Inbox

### 1.1 TaskDialog — "Nova Tarefa" / "Editar Tarefa"

| Campo | Label | Tipo | Placeholder | Opções | Default | Obrigatório |
|-------|-------|------|-------------|--------|---------|-------------|
| title | Título | `Input` text | "O que precisa ser feito?" | — | `""` | ✅ |
| description | Descrição | `Textarea` | "Detalhes adicionais (opcional)" | — | `""` | ❌ |
| status | Status | `Select` | — | "Próxima Ação"=`next`, "Agendada"=`scheduled`, "Aguardando"=`waiting`, "Algum Dia"=`someday` | `"next"` | ✅ |
| scheduledDate | Data agendada | `Input` date | — | — | — | Condicional (se `scheduled`) |
| energy | Energia | `Select` | — | "Baixa"=`low`, "Média"=`medium`, "Alta"=`high` | `"medium"` | ✅ |
| estimatedMinutes | Estimativa min | `Input` number | "Ex: 30" | min=1, max=480 | `""` | ❌ |
| projectId | Projeto | `Select` | — | "Nenhum" + lista de projetos ativos | `""` | ❌ |
| tags | Tags | `Input` text | "trabalho, pessoal, urgente (separadas por vírgula)" | — | `""` | ❌ |
| keyResultId | Vincular a resultado-chave | `Select` | — | "Nenhum" + KRs agrupados por meta | `""` | ❌ |
| notes | Notas | `Textarea` | "Anotações, links, referências..." | — | `""` | ❌ |
| priority | Prioridade | `Toggle Button` | — | "Marcar como prioridade" / "Prioridade Alta" | `false` | ❌ |

### 1.2 QuickCapture — "Captura Rápida" (Sheet bottom)

| Campo | Label | Tipo | Placeholder | Default | Obrigatório |
|-------|-------|------|-------------|---------|-------------|
| content | — | `Input` text | "O que está na sua mente?" | `""` | ✅ |
| notes | — | `Textarea` (toggle) | "Adicione detalhes, contexto ou links..." | `""` | ❌ |

> Botão: "Adicionar à Inbox". Toggle "Adicionar notas" aparece ao clicar.

### 1.3 ProcessInboxDialog — "Processar Inbox" (Wizard 4 etapas)

**Etapa 1 — "Acionável?"**

| Campo | Label | Tipo | Opções |
|-------|-------|------|--------|
| actionable | Acionável? | `RadioGroup` | "Sim, preciso fazer algo"=`yes`, "Não, apenas anotação"=`no` |

Se `no` → Transformar em anotação:

| Campo | Label | Tipo | Placeholder | Obrigatório |
|-------|-------|------|-------------|-------------|
| refTitle | Título | `Input` text | "Nome para esta anotação" | ✅ |
| refTags | Tags | `Input` text | "Separadas por vírgula" | ❌ |

**Etapa 2 — "Próxima ação"**

| Campo | Label | Tipo | Placeholder | Obrigatório |
|-------|-------|------|-------------|-------------|
| taskTitle | Título da tarefa | `Input` text | "Refine o título se necessário" | ✅ |
| nextAction | Qual a próxima ação física? | `Textarea` | "Ex: Ligar para João e marcar reunião" | ❌ |
| taskTags | Tags | `Input` text | "trabalho, urgente, telefone" | ❌ |

**Etapa 3 — "Destino"**

| Campo | Label | Tipo | Opções |
|-------|-------|------|--------|
| destination | Destino | `RadioGroup` (com ícones) | "Fazer agora (<2 min) e concluir"=`done`, "Próxima ação (fazer em breve)"=`next`, "Agendar para uma data"=`scheduled`, "Aguardando alguém (delegada)"=`waiting`, "Algum dia / talvez"=`someday` |

Se `scheduled`:

| Campo | Label | Tipo | Detalhes | Default |
|-------|-------|------|----------|---------|
| scheduledDate | — | `Calendar` (ptBR) | Sem datas passadas | hoje |
| startHour | Horário de início (hora) | `Select` | 6h–23h | — |
| startMinute | Horário de início (min) | `Input` number | — | — |
| durationHours | Duração (horas) | `Input` number | 0–12 | `0` |
| durationMinutes | Duração (minutos) | `Input` number | 0–59 | `0` |

**Etapa 4 — "Detalhes"**

| Campo | Label | Tipo | Opções | Default |
|-------|-------|------|--------|---------|
| energyLevel | Nível de Energia | `RadioGroup` | "🔴 Alta"=`high`, "🟡 Média"=`medium`, "🟢 Baixa"=`low` | `"medium"` |
| timeEstimate | Estimativa de tempo minutos | `Input` number | placeholder "Ex: 30" | `""` |
| projectId | Projeto | `Select` | "Nenhum projeto" + projetos ativos | `""` |
| keyResultId | Vincular a Meta | `Select` | "Nenhuma meta" + KRs agrupados por goal | `""` |

### 1.4 ScheduleTaskDialog — "Programar Tarefa"

| Campo | Label | Tipo | Detalhes | Default |
|-------|-------|------|----------|---------|
| date | — | `Calendar` (ptBR) | Sem datas passadas | hoje |
| startHour | Horário de início (hora) | `Select` | 6h–23h | — |
| startMinute | Horário de início (min) | `Input` number | — | — |
| durationHours | Duração (horas) | `Input` number | 0–12 | `0` |
| durationMinutes | Duração (minutos) | `Input` number | 0–59 | `30` ou estimativa da tarefa |

> Inclui detecção de conflitos com outros blocos.

---

## 2. Projetos

### 2.1 ProjectDialog — "Novo Projeto" / "Editar Projeto"

| Campo | Label | Tipo | Placeholder | Opções | Default | Obrigatório |
|-------|-------|------|-------------|--------|---------|-------------|
| name | Nome | `Input` text | "Nome do projeto" | — | `""` | ✅ |
| description | Descrição | `Textarea` | "Detalhes do projeto (opcional)" | — | `""` | ❌ |
| status | Status | `Select` | — | "Ativo"=`active`, "Concluído"=`completed`, "Arquivado"=`archived` | `"active"` | ✅ |
| deadline | Prazo | `Input` date | — | — | — | ❌ |
| tags | Tags | `Input` text | "trabalho, pessoal (separadas por vírgula)" | — | `""` | ❌ |

---

## 3. Metas (OKR)

### 3.1 GoalDialog — "Nova Meta (OKR)"

| Campo | Label | Tipo | Placeholder | Detalhes | Obrigatório |
|-------|-------|------|-------------|----------|-------------|
| objective | Objetivo | `Input` text | "Ex: Melhorar minha saúde física" | — | ✅ |
| description | Descrição opcional | `Textarea` | "Por que essa meta é importante?" | — | ❌ |
| deadline | Prazo opcional | `Input` date | — | — | ❌ |
| keyResults[] | Resultados-Chave | `Input[]` dinâmico (2–5) | "Ex: Correr 3x por semana" | Mínimo 2, máximo 5 | ✅ (2+) |

### 3.2 GoalEditDialog — "Editar Meta"

| Campo | Label | Tipo | Placeholder | Detalhes | Obrigatório |
|-------|-------|------|-------------|----------|-------------|
| objective | Objetivo | `Input` text | "Qual é seu objetivo?" | — | ✅ |
| description | Por que isso importa? | `Textarea` | "Motivação e contexto..." | — | ❌ |
| deadline | Prazo | `Input` date | — | min=hoje | ❌ |
| keyResults[] | Resultados-Chave | `Input[]` dinâmico | "Ex: Correr 3x por semana" | Com checkpoints | ✅ |

Cada KR tem checkpoints:

| Campo | Tipo | Placeholder |
|-------|------|-------------|
| checkpoint.label | `Input` text | "Novo checkpoint..." |
| checkpoint.done | `Checkbox` | — |

### 3.3 GoalWizardDialog — "Nova Meta" (Wizard 4 etapas)

| Etapa | Campo | Tipo | Placeholder | Obrigatório |
|-------|-------|------|-------------|-------------|
| 1 | objective | `Input` text | "Ex: Melhorar minha saúde física" | ✅ |
| 2 | description | `Textarea` | "Descreva por que essa meta é importante para você neste momento..." | ❌ |
| 3 | deadline | `Input` date | — (min=hoje) | ❌ |
| 4 | keyResults[] | `Input[]` dinâmico (2–5) | "Ex: Correr 3x por semana" | ✅ (2+) |

Cada KR na etapa 4 tem checkpoints: `Input` placeholder "Novo checkpoint..."

### 3.4 UpdateKRDialog — "Atualizar Progresso"

| Campo | Label | Tipo | Placeholder | Obrigatório |
|-------|-------|------|-------------|-------------|
| currentValue | Valor atual | `Input` number (step=0.01) | Mostra valor atual | ✅ |

---

## 4. Hábitos

### 4.1 HabitDialog — "Novo Hábito" / "Editar Hábito"

| Campo | Label | Tipo | Placeholder | Opções | Default | Obrigatório |
|-------|-------|------|-------------|--------|---------|-------------|
| name | Nome do Hábito | `Input` text | "Ex: Meditar, Exercitar, Ler" | — | `""` | ✅ |
| description | Descrição opcional | `Textarea` | "Detalhes sobre o hábito" | — | `""` | ❌ |
| minVersion | Versão Mínima opcional | `Input` text | "Ex: 5 minutos, 1 página" | — | `""` | ❌ |
| frequency | Frequência | `RadioGroup` | — | "Diário"=`daily`, "Semanal"=`weekly` | `"daily"` | ✅ |
| timesPerWeek | Vezes por Semana | Button grid (1–7) | — | 1, 2, 3, 4, 5, 6, 7 | `3` | Condicional (se `weekly`) |
| targetDays | Dias Específicos | Buttons toggle | — | Dom, Seg, Ter, Qua, Qui, Sex, Sáb | `[]` | ❌ |
| keyResultId | Vincular a Key Result | `Select` | — | "Nenhum" + KRs | `""` | ❌ |
| preferredTime | Horário preferido | `Select` | — | "Qualquer horário"=`anytime`, "Manhã"=`morning`, "Tarde"=`afternoon`, "Noite"=`evening` | `"anytime"` | ✅ |

> Inclui componente `HabitSuggestions` para seleção rápida de hábitos pré-definidos.

---

## 5. Calendário e Pomodoro

### 5.1 CalendarBlockDialog — "Novo Bloco de Tempo" / "Editar Bloco"

| Campo | Label | Tipo | Placeholder | Opções | Default | Obrigatório |
|-------|-------|------|-------------|--------|---------|-------------|
| taskId | Vincular tarefa | `Select` | — | "Nenhuma tarefa" + tarefas | `""` | ❌ |
| habitId | Vincular hábito | `Select` | — | "Nenhum hábito" + hábitos | `""` | ❌ |
| title | Título | `Input` text | "O que você vai fazer?" | — | `""` | ✅ |
| description | Descrição | `Textarea` | "Detalhes adicionais" | — | `""` | ❌ |
| type | Tipo | `Select` | — | "Tarefa"=`task`, "Hábito"=`habit`, "Foco"=`focus`, "Reunião"=`meeting`, "Pessoal"=`personal` | `"personal"` | ✅ |
| date | Data | `Calendar` (ptBR) | — | — | hoje | ✅ |
| startHour | Horário início (hora) | `Select` | — | 6h–23h | — | ✅ |
| startMinute | Horário início (min) | `Input` number | — | 0–59 | — | ✅ |
| durationHours | Duração (horas) | `Input` number | — | 0–12 | `1` | ✅ |
| durationMinutes | Duração (minutos) | `Input` number | — | 0–59 | `0` | ✅ |

### 5.2 PomodoroDialog — "Modo Foco"

**Pré-sessão:**

| Campo | Label | Tipo | Opções | Default |
|-------|-------|------|--------|---------|
| presetId | Preset | `Select` | "25/5 (Clássico)", "50/10 (Profundo)", "15/3 (Rápido)" + presets do usuário | Clássico |
| taskId | Tarefa | `Select` | "Sem tarefa vinculada" + tarefas ativas | `""` |

**Pós-sessão:**

| Campo | Label | Tipo | Placeholder |
|-------|-------|------|-------------|
| notes | Notas | `Textarea` | "Notas sobre a sessão (opcional)" |

> Labels durante sessão: "Foco", "Pausa", "Pausa Longa". Controles: Iniciar/Retomar, Pausar, Stop, Skip.

### 5.3 PomodoroPresetDialog — "Novo Preset" / "Editar Preset"

| Campo | Label | Tipo | Placeholder | Default | Obrigatório |
|-------|-------|------|-------------|---------|-------------|
| name | Nome | `Input` text | "Meu preset personalizado" | `""` | ✅ |
| focusMinutes | Foco min | `Input` number | — | `25` | ✅ (min=1) |
| breakMinutes | Pausa min | `Input` number | — | `5` | ✅ (min=1) |
| longBreakMinutes | Pausa longa min | `Input` number | — | `15` | ✅ (min=1) |
| cyclesBeforeLongBreak | Ciclos até pausa longa | `Input` number | — | `4` | ✅ (min=1) |

---

## 6. Anotações

### 6.1 NoteDialog — "Nova Anotação" / "Editar Anotação"

| Campo | Label | Tipo | Placeholder | Obrigatório |
|-------|-------|------|-------------|-------------|
| title | Título | `Input` text | "Título da anotação" | ❌ |
| content | Conteúdo | `Textarea` (rows=8) | "Escreva sua anotação aqui..." | ❌ |
| tags | Tags separadas por vírgula | `Input` text | "trabalho, ideias, pesquisa" | ❌ |
| sourceUrl | URL de origem | `Input` url | "https://..." | ❌ |

### 6.2 NoteEditor — Editor de Anotação (fullscreen)

| Campo | Label | Tipo | Placeholder | Detalhes |
|-------|-------|------|-------------|----------|
| title | — | `Input` text | (implícito) | — |
| content | — | `Textarea` (autosize) | — | Com toolbar Markdown: Bold, Italic, Strikethrough, H1, H2, Bullet list, Numbered list, Checkbox, Quote, Code, Link |
| tags | — | `Input` text | — | Separadas por vírgula |
| sourceUrl | — | `Input` url | — | Em seção "metadata" toggle |

> Auto-save com debounce de 3s. Exibe contagem de palavras/caracteres.

---

## 7. Finanças

### 7.1 TransactionsTab — "Nova Receita"

| Campo | Label | Tipo | Placeholder | Opções | Obrigatório |
|-------|-------|------|-------------|--------|-------------|
| incomeDescription | Descrição | `Input` text | "Ex: Salário, Freelance, Venda" | — | ✅ |
| incomeAmount | Valor | `CurrencyInput` | — | — | ✅ |
| incomeDate | Data | `Calendar` (Popover, ptBR) | "Selecione" | — | ✅ |
| incomeAccountId | Conta | `Select` | "Selecione" | Contas do usuário | ✅ |
| incomeCategoryId | Categoria (opcional) | `Select` | "Selecione uma categoria" | Categorias tipo income | ❌ |

### 7.2 TransactionsTab — "Nova Despesa"

| Campo | Label | Tipo | Placeholder | Opções | Obrigatório |
|-------|-------|------|-------------|--------|-------------|
| expenseDescription | Descrição | `Input` text | "Ex: Supermercado, Uber, Almoço" | — | ✅ |
| expenseAmount | Valor | `CurrencyInput` | — | — | ✅ |
| expenseDate | Data | `Calendar` (Popover, ptBR) | "Selecione" | — | ✅ |
| expenseAccountId | Conta | `Select` | "Selecione" | Contas do usuário | ✅ |
| expenseCategoryId | Categoria (opcional) | `Select` | "Selecione uma categoria" | Categorias tipo expense | ❌ |

### 7.3 IncomeExpensesTab — "Nova Receita Fixa"

| Campo | Label | Tipo | Placeholder | Opções | Default | Obrigatório |
|-------|-------|------|-------------|--------|---------|-------------|
| incomeName | Nome | `Input` text | "Ex: Salário, Aluguel recebido" | — | `""` | ✅ |
| incomeAmount | Valor | `CurrencyInput` | — | — | `""` | ✅ |
| incomeAccountId | Conta | `Select` | "Selecione a conta" | Contas do usuário | `""` | ✅ |
| incomeFrequency | Frequência | `Select` | — | "Mensal"=`monthly`, "Semanal"=`weekly`, "Quinzenal"=`biweekly`, "Anual"=`yearly` | `"monthly"` | ✅ |
| incomeDayOfMonth | Dia do mês | `Input` number | "Ex: 5" | min=1, max=31 | `""` | ❌ |
| incomeAutoConfirm | Lançamento automático | `Switch` | — | — | `false` | ❌ |

> Descrição do Switch: "Será lançado automaticamente no dia definido" (on) / "Você precisará confirmar manualmente cada mês" (off)

### 7.4 IncomeExpensesTab — "Nova Despesa Fixa"

| Campo | Label | Tipo | Placeholder | Opções | Default | Obrigatório |
|-------|-------|------|-------------|--------|---------|-------------|
| expenseName | Nome | `Input` text | "Ex: Aluguel, Internet, Streaming" | — | `""` | ✅ |
| expenseAmount | Valor | `CurrencyInput` | — | — | `""` | ✅ |
| expenseCategoryId | Categoria | `Select` | "Selecione a categoria" | Categorias tipo expense | `""` | ✅ |
| expenseAccountId | Conta | `Select` | "Selecione a conta" | Contas do usuário | `""` | ✅ |
| expenseFrequency | Frequência | `Select` | — | "Mensal"=`monthly`, "Semanal"=`weekly`, "Quinzenal"=`biweekly`, "Anual"=`yearly` | `"monthly"` | ✅ |
| expenseDayOfMonth | Dia do mês | `Input` number | "Ex: 10" | min=1, max=31 | `""` | ❌ |
| expenseAutoConfirm | Lançamento automático | `Switch` | — | — | `false` | ❌ |

### 7.5 SettingsTab — "Nova Categoria"

| Campo | Label | Tipo | Placeholder | Opções | Default | Obrigatório |
|-------|-------|------|-------------|--------|---------|-------------|
| name | Nome | `Input` text | "Ex: Alimentação" | — | `""` | ✅ |
| type | Tipo | `Select` | — | "Despesa"=`expense`, "Receita"=`income` | `"expense"` | ✅ |

### 7.6 SettingsTab — "Nova Conta"

| Campo | Label | Tipo | Placeholder | Opções | Default | Obrigatório |
|-------|-------|------|-------------|--------|---------|-------------|
| name | Nome | `Input` text | "Ex: Nubank" | — | `""` | ✅ |
| type | Tipo | `Select` | — | "Conta Corrente"=`checking`, "Dinheiro"=`cash`, "Cartão de Crédito"=`credit`, "Poupança"=`savings`, "Investimento"=`investment` | `"checking"` | ✅ |
| balance | Saldo Inicial | `CurrencyInput` | — | — | `""` | ✅ |

### 7.7 ChatInput — Input de IA para Finanças

| Campo | Label | Tipo | Placeholder | Detalhes |
|-------|-------|------|-------------|----------|
| input | — | `Input` text | — | Texto livre processado por LLM (GPT-4o-mini) |

> Também suporta entrada por voz (`SpeechRecognition`, lang `pt-BR`). A IA extrai: amount, description, categoryId, date, type (expense/income), confidence. Resultado é mostrado como sugestão editável antes de confirmar.

---

## 8. Leitura

### 8.1 BookDialog — "Novo Livro" / "Editar Livro"

| Campo | Label | Tipo | Placeholder | Detalhes | Default | Obrigatório |
|-------|-------|------|-------------|----------|---------|-------------|
| title | Título | `Input` text | "Nome do livro" | — | `""` | ✅ |
| author | Autor | `Input` text | "Nome do autor" | — | `""` | ✅ |
| totalPages | Total de Páginas | `Input` number | "300" | min=0, max=99999 | `""` | ✅ |
| startDate | Data de Início | `Calendar` (Popover, ptBR) | — | — | hoje | ✅ |
| deadline | Meta de Conclusão | `Calendar` (Popover, ptBR) | — | — | — | ✅ |
| notes | Notas | `Textarea` | "Anotações sobre o livro..." | — | `""` | ❌ |

### 8.2 UpdateProgressDialog — "Atualizar Progresso"

| Campo | Label | Tipo | Detalhes | Obrigatório |
|-------|-------|------|----------|-------------|
| currentPage | Página Atual | `Input` number | min=0, max=totalPages | ✅ |
| notes | Notas | `Textarea` | placeholder "Como foi a leitura hoje..." | ❌ |

---

## 9. Estudos

### 9.1 StudySessionDialog — "Nova Sessão de Estudo" (2 modos)

**Modo Cronômetro (timer):**

| Campo | Label | Tipo | Placeholder | Opções | Default | Obrigatório |
|-------|-------|------|-------------|--------|---------|-------------|
| subjectId | Assunto * | `Select` | "Selecione um assunto" | Assuntos do usuário | `""` | ✅ |
| quickNotes | Notas rápidas | `Textarea` | "O que você vai estudar..." | — | `""` | ❌ |
| scheduleReviews | Agendar revisões | `Switch` | — | Label: "D+1, D+3, D+7, D+14" | `true` | ❌ |

**Modo Manual (registrar):**

| Campo | Label | Tipo | Placeholder | Default | Obrigatório |
|-------|-------|------|-------------|---------|-------------|
| subjectId | Assunto * | `Select` | "Selecione um assunto" | `""` | ✅ |
| manualDuration | Duração minutos * | `Input` number | "ex: 45" | `""` | ✅ |
| quickNotes | Notas rápidas | `Textarea` | "O que você vai estudar..." | `""` | ❌ |
| scheduleReviews | Agendar revisões | `Switch` | — | `true` | ❌ |

> Dois modos alternáveis via tabs: "⏱️ Cronômetro" e "✍️ Registrar manualmente"

### 9.2 RecordedSessionDialog — "Sessão de Estudo com IA"

| Campo | Label | Tipo | Placeholder | Opções | Obrigatório |
|-------|-------|------|-------------|--------|-------------|
| subjectId | Assunto | `Select` | "Selecione um assunto" | Assuntos do usuário | ✅ |
| duration | Duração (minutos) | `Input` number | "ex: 60" | min=1 | ✅ |
| transcription | Transcrição / Notas | `Textarea` (rows=8) | "Cole a transcrição ou escreva suas notas de estudo aqui..." | — | ✅ |

> Botão "Gerar Resumo e Perguntas com IA" (GPT-4o-mini). Exibe resumo e 5 perguntas de revisão geradas.
> Requer consentimento prévio via ConsentDialog.

### 9.3 SelfTestDialog — "Perguntas de Auto-teste"

| Campo | Label | Tipo | Placeholder | Detalhes |
|-------|-------|------|-------------|----------|
| questions[0..4] | — | `Input[]` text (3–5 campos) | "Pergunta 1 *", "Pergunta 2 *", ... | Min 3 obrigatórias, max 5 |

> Validação: "Preencha pelo menos 3 perguntas para salvar". Botão "Pular" disponível.

### 9.4 ConsentDialog — "Consentimento para Gravação e Processamento"

| Campo | Label | Tipo | Detalhes |
|-------|-------|------|----------|
| understood | Entendo que a transcrição... | `Checkbox` | aria-required |
| agreedProcessing | Concordo com o processamento... | `Checkbox` | aria-required |

> Ambos obrigatórios para habilitar "Concordo e Continuar".

---

## 10. Bem-estar (Wellness)

### 10.1 CheckInDialog — "Check-in Diário" / "Editar Check-in"

| Campo | Label | Tipo | Detalhes | Opções | Default | Obrigatório |
|-------|-------|------|----------|--------|---------|-------------|
| sleepHours | Horas de sono | `Slider` | min=0, max=12, step=0.5 | — | `7` | ✅ |
| energyLevel | Nível de energia | Button group (RadioGroup) | — | "Baixo"=`low`, "Médio"=`medium`, "Alto"=`high` | `"medium"` | ✅ |
| mood | Humor | Button group (RadioGroup) | — | "Baixo"=`low`, "Médio"=`medium`, "Alto"=`high` | `"medium"` | ✅ |
| notes | Notas (opcional) | `Textarea` (rows=3) | "Como você está se sentindo hoje?" | — | `""` | ❌ |

### 10.2 WellnessProgramDialog — "Iniciar Programa de Bem-estar"

| Campo | Label | Tipo | Opções | Default | Obrigatório |
|-------|-------|------|--------|---------|-------------|
| type | Tipo de Programa | `Select` | "Rotina de Sono"=`sleep`, "Redução de Tela"=`screen_time`, "Rotina Matinal"=`morning_routine`, "Foco e Concentração"=`focus` | `"sleep"` | ✅ |
| duration | Duração | Button group (3 botões) | 7 dias, 14 dias, 30 dias | `7` | ✅ |

> Exibe descrição do programa selecionado com ícone.

### 10.3 CheckInInsightDialog — "Sugestão para hoje"

> Dialog de exibição apenas (sem formulário). Mostra insight gerado com base no check-in. Tones: recovery, light, balanced, boost.

---

## 11. Treino

### 11.1 PlanDialog — "Nova Ficha" / "Editar Ficha"

| Campo | Label | Tipo | Placeholder | Detalhes | Default | Obrigatório |
|-------|-------|------|-------------|----------|---------|-------------|
| name | Nome da Ficha | `Input` text | "Ex: Treino A - Peito e Tríceps" | — | `""` | ✅ |
| daysOfWeek | Dias da Semana | `ToggleGroup` multiple | — | Seg, Ter, Qua, Qui, Sex, Sáb, Dom | `[]` | ✅ (min 1) |
| notes | Observações | `Textarea` | "Anotações sobre a ficha..." | — | `""` | ❌ |

### 11.2 ExerciseDialog — "Novo Exercício" / "Editar Exercício"

| Campo | Label | Tipo | Placeholder | Opções | Default | Obrigatório |
|-------|-------|------|-------------|--------|---------|-------------|
| name | Nome do Exercício | `Input` text | "Ex: Supino Reto" | — | `""` | ✅ |
| muscleGroup | Grupo Muscular | `Select` | — | "Peito"=`chest`, "Costas"=`back`, "Ombros"=`shoulders`, "Bíceps"=`biceps`, "Tríceps"=`triceps`, "Antebraço"=`forearms`, "Core/Abdômen"=`core`, "Quadríceps"=`quadriceps`, "Posterior"=`hamstrings`, "Glúteos"=`glutes`, "Panturrilha"=`calves`, "Corpo Inteiro"=`full_body`, "Cardio"=`cardio`, "Outro"=`other` | `""` | ❌ |
| equipment | Equipamento | `Select` | — | Catálogo de equipamentos (EQUIPMENT_OPTIONS) | `""` | ❌ |

### 11.3 SetLogDialog — "Adicionar Set" / "Editar Set"

| Campo | Label | Tipo | Placeholder | Detalhes | Default | Obrigatório |
|-------|-------|------|-------------|----------|---------|-------------|
| reps | Repetições | `Input` number | "0" | — | `""` | ✅ |
| weight | Carga | `Input` number (step=0.5) | "0" | — | `""` | ✅ |
| weightUnit | (junto da Carga) | `Select` | — | "kg", "lb" | `"kg"` | ✅ |
| isWarmup | Aquecimento | `Switch` | — | Label: "Não conta no volume total" | `false` | ❌ |

### 11.4 ExercisePrescriptionDialog — "Configurar: {exerciseName}"

**Presets rápidos (grid de botões):**
- 3×15, 3×12, 3×8, 4×15, 4×12, 4×8, 3×8–12, 4×8–12

**Seção A — Configuração customizada:**

| Campo | Label | Tipo | Detalhes | Default |
|-------|-------|------|----------|---------|
| customSets | Séries de trabalho | `Stepper` (1–10) | — | `3` |
| useRange | Usar faixa de reps | `Switch` | — | `false` |
| customRepsFixed | Reps | `Input` number | Se useRange=false | — |
| customRepsMin | Mín | `Input` number | Se useRange=true | — |
| customRepsMax | Máx | `Input` number | Se useRange=true | — |
| prescriptionNote | Nota (opcional) | `Input` text | "Ex: Pausar 2s no topo" | `""` |

**Seção B — Estrutura avançada (Warmup/Feeder/Work):**

| Campo | Label | Tipo | Detalhes | Default |
|-------|-------|------|----------|---------|
| useStructure | Estrutura avançada | `Switch` | Toggle da seção | `false` |
| warmupSets | Warmup sets | `Stepper` (0–4) | — | `0` |
| feederSets | Feeder sets | `Stepper` (0–4) | — | `0` |
| workSets | Work sets | `Stepper` (1–6) | — | `3` |

**Seção C — Técnica avançada:**

| Campo | Label | Tipo | Opções |
|-------|-------|------|--------|
| showTechniques | Técnica avançada | `Switch` | Toggle da seção |
| selectedTechnique | — | Pill buttons | "Backoff Set"=`backoff`, "Rest-pause"=`rest_pause`, "Pulse Set"=`pulse_set`, "Widowmaker"=`widowmaker` (20 reps), "Bi-set/Superset"=`bi_set`, "Personalizada"=`custom` |

**Parâmetros por técnica:**

| Técnica | Campo | Label | Tipo | Detalhes |
|---------|-------|-------|------|----------|
| backoff | backoffPercent | Redução de carga | `Input` number + "%" | min=10, max=50 |
| rest_pause | restSeconds | Pausa entre mini-sets | `Input` number + "seg" | min=10, max=60 |
| rest_pause | targetTotalReps | Reps total alvo | `Input` number | min=6, max=30 |
| bi_set | linkedPlanItemId | Vincular com exercício | `Select` | Outros exercícios da ficha |
| custom | customTechniqueLabel | Nome da técnica | `Input` text | placeholder "Ex: Myo-reps, Drop set..." |
| custom | techniqueNote | Como você faz essa técnica? | `Textarea` (rows=3) | placeholder "Descreva os passos em 1–3 linhas..." |
| (todos exceto custom) | techniqueNote | Nota da técnica (opcional) | `Input` text | placeholder "Ex: Aplicar na última série" |

> Cada técnica tem seção colapsável "Como fazer" com instruções em steps.

---

## 12. Dieta

### 12.1 MealDialog — (Título dinâmico via prop)

| Campo | Label | Tipo | Placeholder | Detalhes | Default | Obrigatório |
|-------|-------|------|-------------|----------|---------|-------------|
| name | Nome da refeição * | `Input` text | "Ex: Café da manhã" | — | `""` | ✅ |
| time | Horário | `Input` time | — | HH:MM | `"12:00"` | ✅ |
| foods[] | Alimentos | Lista dinâmica | — | Cada item: name, quantity, unit | `[]` | ❌ |
| notes | Notas (opcional) | `Textarea` (rows=2) | "Observações sobre a refeição..." | — | `""` | ❌ |

**Adicionar alimento inline:**

| Campo | aria-label | Tipo | Placeholder | Detalhes |
|-------|-----------|------|-------------|----------|
| newFoodName | Nome do alimento | `Input` text | "Nome do alimento" | — |
| newFoodQty | Quantidade | `Input` number (step=0.1) | "Qtd" | min=0, w=16 |
| newFoodUnit | Unidade | `Input` text | "Un." | w=16 |

### 12.2 MealTemplateDialog — (Título dinâmico via prop)

| Campo | Label | Tipo | Placeholder | Opções | Default | Obrigatório |
|-------|-------|------|-------------|--------|---------|-------------|
| name | Nome * | `Input` text | "Ex: Café da manhã" | — | `""` | ✅ |
| time | Horário padrão | `Input` time | — | — | `"12:00"` | ✅ |
| frequency | Frequência | `Select` | — | "Manual"=`manual`, "Diário"=`daily`, "Dias úteis"=`weekdays`, "Fins de semana"=`weekends`, "Personalizado"=`custom` | `"manual"` | ✅ |
| daysOfWeek | — | Buttons toggle (Dom–Sáb) | — | Se frequency=`custom` | `[]` | Condicional (min 1 se custom) |
| foods[] | Alimentos do template | Lista dinâmica | — | Mesmo modelo do MealDialog | `[]` | ❌ |

**Sugestões rápidas (apenas novo template):**
Botões: "Café da manhã" (07:30), "Lanche da manhã" (10:00), "Almoço" (12:30), "Lanche da tarde" (15:30), "Jantar" (19:30), "Ceia" (21:30)

**Frequência labels (no Select):**

| Valor | Label exibido | Descrição |
|-------|--------------|-----------|
| `manual` | Manual | "Este template só será aplicado manualmente." |
| `daily` | Diário | "As refeições serão criadas automaticamente nos dias selecionados." |
| `weekdays` | Dias úteis | (idem automático) |
| `weekends` | Fins de semana | (idem automático) |
| `custom` | Personalizado | (idem automático) + grid de dias |

---

## 13. Autenticação

### 13.1 LoginScreen — "Acorda" / "Bem-vindo de volta"

| Campo | Label | Tipo | Placeholder | Detalhes | Obrigatório |
|-------|-------|------|-------------|----------|-------------|
| email | Email | `Input` email | "seu@email.com" | autoComplete="email" | ✅ |
| password | Senha | `Input` password | "••••••••" | autoComplete="current-password" | ✅ |

> Link: "Esqueci minha senha" → `/esqueci-senha`

### 13.2 ForgotPasswordScreen — "Esqueceu a senha?"

| Campo | Label | Tipo | Placeholder | Obrigatório |
|-------|-------|------|-------------|-------------|
| email | E-mail | `Input` email | "seu@email.com" | ✅ |

> Botão: "Enviar link de recuperação". Sucesso: "Se o e-mail estiver cadastrado, você receberá instruções..."

### 13.3 ResetPasswordScreen — "Redefinir senha"

| Campo | Label | Tipo | Placeholder | Validação | Obrigatório |
|-------|-------|------|-------------|-----------|-------------|
| password | Nova senha | `Input` password | "Mínimo 8 caracteres" | ≥8 chars | ✅ |
| passwordConfirm | Confirmar nova senha | `Input` password | "Digite a senha novamente" | Deve coincidir | ✅ |

> Toggle de visibilidade 👁️ em cada campo. Validações inline: "Mínimo 8 caracteres" ✅/❌, "Senhas conferem" ✅/❌.

### 13.4 ActivateAccountScreen — "Ativar sua conta"

| Campo | Label | Tipo | Placeholder | Validação | Obrigatório |
|-------|-------|------|-------------|-----------|-------------|
| name | Seu nome (opcional) | `Input` text | "Como você quer ser chamado?" | — | ❌ |
| password | Senha | `Input` password | "Mínimo 8 caracteres" | ≥8 chars | ✅ |
| passwordConfirm | Confirmar senha | `Input` password | "Digite a senha novamente" | Deve coincidir | ✅ |

> Toggle de visibilidade em cada campo de senha. Mesma validação inline do Reset.

---

## 14. Perfil

### 14.1 ProfileDialog — "Meu Perfil"

| Campo | Label | Tipo | Placeholder | Detalhes | Obrigatório |
|-------|-------|------|-------------|----------|-------------|
| avatar | — | `Input` file | — | accept="image/*", max 5MB | ❌ |
| name | Nome | `Input` text | "Seu nome" | — | ❌ |
| email | Email | `Input` email | — | disabled (somente leitura) | — |

**Seção "Alterar Senha" (toggle):**

| Campo | Label | Tipo | Placeholder | Validação | Obrigatório |
|-------|-------|------|-------------|-----------|-------------|
| currentPassword | Senha atual | `Input` password | "••••••••" | — | ✅ |
| newPassword | Nova senha | `Input` password | "Mínimo 8 caracteres" | ≥8 chars | ✅ |
| confirmPassword | Confirmar nova senha | `Input` password | "Repita a nova senha" | Deve coincidir | ✅ |

> Toggle de visibilidade em cada campo. Validação "As senhas não coincidem" se diferem.
> Info de conta (somente leitura): Status da conta, Fuso horário, Conta criada em, Último acesso.

---

## 15. Configurações

### 15.1 SettingsDialog — "Configurações"

| Campo | Label | Tipo | Opções | Default |
|-------|-------|------|--------|---------|
| appearance | Modo escuro | `Switch` | on=`dark`, off=`light` | Verifica settings.appearance |
| weekStartsOn | Início da semana | `Select` | "Domingo"=`0`, "Segunda-feira"=`1` | settings.weekStartsOn |

### 15.2 ModulesDialog — "Módulos"

| Módulo | Label | Tipo | Default |
|--------|-------|------|---------|
| financas | Finanças | `Switch` | — |
| leitura | Leitura / PDF | `Switch` | — |
| estudos | Estudos | `Switch` | — |
| bemestar | Bem-estar | `Switch` | — |
| treino | Treino | `Switch` | — |
| dieta | Dieta | `Switch` | — |

---

## 16. Privacidade

### 16.1 PrivacyDialog — "Privacidade e Dados"

| Campo | Label | Tipo | Placeholder | Detalhes | Obrigatório |
|-------|-------|------|-------------|----------|-------------|
| confirmText | — | `Input` text | "APAGAR" | Deve digitar exatamente "APAGAR" | Condicional |

> Exibe informações sobre dados armazenados. Zona de perigo: botão "Apagar todos os meus dados" → input de confirmação.

### 16.2 PrivacySettings — página completa

Mesma funcionalidade do PrivacyDialog, com adição de botões de exportação:
- "Exportar tudo (JSON)"
- "Exportar Finanças (CSV)"
- "Exportar Estudos (Markdown)"
- "Exportar Leitura (Markdown)"

E o mesmo mecanismo de exclusão com input "APAGAR" (placeholder "Digite APAGAR").

---

## 17. Onboarding

### 17.1 OnboardingFlow — Wizard de 6 etapas

Barra de progresso: "Passo X de 6". Link "Pular setup".

**Etapa 1 — WelcomeStep:** Apenas botão "Começar" (sem formulário)

**Etapa 2 — GoalStep:** "Sua primeira meta"

Phase "objective":

| Campo | Label | Tipo | Placeholder | Obrigatório |
|-------|-------|------|-------------|-------------|
| objective | Objetivo | `Input` text | "Ex: Melhorar minha saúde física" | ✅ |
| description | Por quê? (opcional) | `Textarea` | "O que te motiva a atingir essa meta?" | ❌ |

Sugestões (Badges clicáveis):
- "Melhorar minha saúde física"
- "Organizar minhas finanças"
- "Desenvolver minha carreira"
- "Ler mais livros"
- "Aprender algo novo"
- "Cuidar da saúde mental"

Phase "keyresults":

| Campo | Label | Tipo | Placeholder | Detalhes |
|-------|-------|------|-------------|----------|
| keyResults[] | Key Results | `Input[]` (1–5) | "Ex: Exercitar 3x por semana", "Ex: Perder 5kg em 3 meses" | Min 0 (permitido salvar sem KR, será criado genérico) |

**Etapa 3 — HabitsStep:** "Escolha seus hábitos"

> Grid 2 colunas de cards com emoji + título. Seleção múltipla por toque.
> Hábitos disponíveis definidos em `constants/habitSuggestions.ts` (catálogo pré-definido com emoji, título, descrição, cadência).
> Dica: "Comece com poucos hábitos e aumente gradualmente"

**Etapa 4 — GuidedTourStep:** Tour guiado (sem formulário)

**Etapa 5 — ModulesStep:** "Personalize seu Acorda"

| Módulo | Label | Descrição | Ícone cor |
|--------|-------|-----------|-----------|
| financas | Finanças | Controle receitas, despesas e orçamento... | emerald |
| leitura | Leitura / PDF | Gerencie sua lista de livros... | blue |
| estudos | Estudos | Organize matérias e sessões de estudo... | purple |
| bemestar | Bem-estar | Acompanhe seu humor, qualidade do sono... | rose |
| treino | Treino | Monte planos de treino... | orange |
| dieta | Dieta | Planeje refeições... | amber |

Cada módulo: card clicável com `Switch` toggle. Default: todos `false`.

**Etapa 6 — ReadyStep:** Resumo com contagens (sem formulário). Botão "Começar a usar".

---

## 18. Exportação

### 18.1 ExportDialog — "Exportar dados"

| Campo | Label | Tipo | Default |
|-------|-------|------|---------|
| exportTasks | Tarefas e projetos | `Checkbox` | — |
| exportHabits | Hábitos e registros | `Checkbox` | — |
| exportGoals | Metas e Key Results | `Checkbox` | — |

> Formato fixo: Markdown.

---

## Apêndice A — Tipos TypeScript (referência)

```typescript
TaskStatus = 'inbox' | 'next' | 'scheduled' | 'waiting' | 'someday' | 'done'
EnergyLevel = 'low' | 'medium' | 'high'
ProjectStatus = 'active' | 'archived' | 'completed'
CalendarBlockType = 'task' | 'habit' | 'focus' | 'meeting' | 'personal'
HabitFrequency = 'daily' | 'weekly'
ModuleType = 'financas' | 'leitura' | 'estudos' | 'bemestar' | 'treino' | 'integracoes' | 'dieta'
Appearance = 'light' | 'dark'
TransactionType = 'income' | 'expense' | 'transfer'
IncomeType = 'fixed' | 'variable'
RecurrenceFrequency = 'daily' | 'monthly' | 'weekly' | 'biweekly' | 'yearly'
HighlightColor = 'yellow' | 'green' | 'blue' | 'pink' | 'purple'
WellnessProgramType = 'sleep' | 'screen_time' | 'morning_routine' | 'focus'
CheckInMood = 'low' | 'medium' | 'high'
MuscleGroup = 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'forearms' | 'core' | 'quadriceps' | 'hamstrings' | 'glutes' | 'calves' | 'full_body' | 'cardio' | 'other'
WeightUnit = 'kg' | 'lb'
PrescriptionMode = 'straight' | 'range' | 'custom' | 'warmup_feeder_work'
TechniqueType = 'none' | 'backoff' | 'rest_pause' | 'pulse_set' | 'widowmaker' | 'bi_set' | 'custom'
DietTemplateFrequency = 'manual' | 'daily' | 'weekdays' | 'weekends' | 'custom'
BookStatus = 'reading' | 'completed' | 'paused'
GoalStatus = 'active' | 'achieved' | 'abandoned'
HabitPreferredTime = 'morning' | 'afternoon' | 'evening' | 'anytime'
FinanceAccountType = 'cash' | 'checking' | 'credit' | 'savings' | 'investment'
WellnessProgramDuration = 7 | 14 | 30
WeekStartsOn = 0 | 1
```

## Apêndice B — Componentes UI usados

| Componente | Origem |
|-----------|--------|
| `Input` | shadcn/ui |
| `Textarea` | shadcn/ui |
| `Select` / `SelectTrigger` / `SelectValue` / `SelectContent` / `SelectItem` | shadcn/ui |
| `RadioGroup` / `RadioGroupItem` | shadcn/ui |
| `Switch` | shadcn/ui |
| `Checkbox` | shadcn/ui |
| `Calendar` | shadcn/ui (locale ptBR) |
| `Slider` | shadcn/ui |
| `Button` | shadcn/ui |
| `Dialog` / `DialogContent` / `DialogHeader` / `DialogTitle` / `DialogFooter` | shadcn/ui |
| `Sheet` / `SheetContent` / `SheetHeader` / `SheetTitle` | shadcn/ui |
| `Popover` / `PopoverTrigger` / `PopoverContent` | shadcn/ui |
| `AlertDialog` | shadcn/ui |
| `Badge` | shadcn/ui |
| `Label` | shadcn/ui |
| `ToggleGroup` | shadcn/ui |
| `Tooltip` | shadcn/ui |
| `Collapsible` | shadcn/ui |
| `CurrencyInput` | Custom (componente interno para valores monetários) |
| `Stepper` | Custom (componente interno ±) |
