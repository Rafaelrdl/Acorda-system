# Planning Guide

Acorda é um sistema operacional pessoal minimalista que conecta metas, hábitos, tarefas, planejamento semanal e foco em uma única interface fluida e sem poluição visual.

**Experience Qualities**:

1. **Effortless** - Capturar, processar e executar deve ser natural como respirar, sem fricção ou decisões desnecessárias
2. **Focused** - A interface desaparece para que você possa se concentrar no que importa agora, não no sistema
3. **Empowering** - Ver progresso tangível cria momentum e motivação para continuar evoluindo

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views) - Acorda integra múltiplos sistemas (GTD, OKR, hábitos, calendário, Pomodoro) em uma experiência unificada que se adapta ao contexto do usuário e persiste dados complexos isolados por usuário.

## Essential Features

### Autenticação GitHub

- Functionality: Login via GitHub para identificar e isolar dados do usuário
- Purpose: Garantir que cada usuário veja apenas seus próprios dados
- Trigger: Ao acessar o app sem estar autenticado
- Progression: Usuário não autenticado → Detecta ausência de auth → Mostra tela de boas-vindas → Botão "Entrar com GitHub" → Autentica → Carrega dashboard pessoal
- Success criteria: userId é capturado e todos os dados são isolados por usuário

### Inbox e Captura Rápida (GTD)

- Functionality: Capturar qualquer pensamento, ideia ou tarefa instantaneamente via FAB global
- Purpose: Esvaziar a mente sem interromper o fluxo
- Trigger: Tap no botão "+" flutuante
- Progression: Tap FAB → Sheet aparece → Digita item → Enter ou tap "Adicionar" → Item salvo no inbox → Sheet fecha → Volta ao contexto anterior
- Success criteria: Item aparece na inbox da aba Planejar, captura leva menos de 3 segundos

### Processar Inbox (Triagem GTD Completa)

- Functionality: Fluxo guiado GTD para transformar itens da inbox em tarefas, referências ou "um dia/talvez"
- Purpose: Organizar o caos capturado em ações executáveis com decisões claras
- Trigger: Tap no ícone de edição em item da inbox
- Progression:
  - Passo 1: "Isso é acionável?" → SIM/NÃO
  - Se NÃO: Classificar como "Referência" (guardar para consultar) ou "Um dia/Talvez" → Adicionar tags → Salvar
  - Se SIM: Passo 2: "Qual a próxima ação física?" → Descrever ação concreta → Adicionar tags
  - Passo 3: "Leva menos de 2 minutos?" → SIM: Oferecer botão "Fazer agora" (marca como concluída) / NÃO: Criar como tarefa NEXT
  - Item é marcado como processado e removido da inbox principal
- Success criteria: Inbox pode chegar a zero, itens processados viram tarefas/referências, regra dos 2 minutos funciona

### Tarefas com Contexto (GTD)

- Functionality: Lista de tarefas com status, tags, níveis de energia e contextos
- Purpose: Escolher a ação certa baseado no tempo, energia e contexto disponível
- Trigger: Navega para seção de tarefas na aba Planejar
- Progression: Visualiza tarefas → Filtra por tag/energia/status → Seleciona tarefa → Marca como concluída ou edita → Status atualiza
- Success criteria: Tarefas podem ser filtradas, editadas e concluídas, aparecem nos stats do dia

### Top 3 Prioridades do Dia

- Functionality: Escolher até 3 tarefas como prioridades para hoje
- Purpose: Foco cristalino no que realmente importa hoje
- Trigger: Ao abrir a aba Hoje ou ao planejar o dia
- Progression: Aba Hoje → Seção "Top 3" → Tap "Adicionar prioridade" → Seleciona da lista de tarefas → Tarefa aparece no Top 3 → Pode marcar como concluída
- Success criteria: No máximo 3 prioridades visíveis, check visual ao concluir

### Hábitos e Tracking Diário

- Functionality: Criar hábitos com frequência (diário ou X vezes por semana), definir versão mínima, vincular a KRs, e marcar conclusão diária
- Purpose: Construir consistência em comportamentos que geram resultados e conectar hábitos a metas
- Trigger: Checklist de hábitos na aba Hoje ou gerenciamento na aba Planejar > Hábitos
- Progression:
  - Criar: Tap "Novo Hábito" → Define nome → Escolhe frequência (diário OU X vezes/semana) → Define "versão mínima" (ex: "5 minutos") → Opcionalmente vincula a um KR → Salva
  - Executar: Visualiza hábitos do dia na aba Hoje → Tap checkbox para marcar como concluído → Registro salvo → Contador de streak atualiza
  - Acompanhar: Visualiza resumo semanal (7 dias) e mensal (30 dias) na aba Evolução
- Success criteria:
  - Hábitos podem ser diários ou X vezes/semana com dias preferenciais
  - Campo "mínimo do hábito" reforça consistência
  - Hábitos vinculados a KRs aparecem na visualização de progresso de metas
  - Streak de consecutividade calculado corretamente
  - Visualizações de 7 e 30 dias disponíveis

### Calendário Interno e Time Blocking (Planejamento Semanal)

- Functionality: Criar e editar blocos de tempo em visualização semanal com detecção de conflitos
- Purpose: Planejar quando cada coisa vai acontecer, não apenas o quê
- Trigger: Tab "Semana" na aba Planejar
- Progression:
  - Visualiza semana (grid de horários 6h-21h, 7 dias)
  - Navega entre semanas com setas ou botão "Hoje"
  - Clica em horário vazio → Dialog abre
  - Pode vincular a uma tarefa existente (preenche título e duração automaticamente)
  - Define título, descrição, tipo (tarefa/foco/reunião/pessoal), data, hora início, duração
  - Ao salvar, se houver sobreposição, mostra aviso visual "Conflito" mas não bloqueia
  - Bloco aparece colorido no calendário
  - Clica em bloco existente para editar ou excluir
  - Blocos do dia aparecem na agenda da aba "Hoje"
- Success criteria: Blocos criados, editados, excluídos; conflitos mostram aviso; agenda do dia sincronizada

### Pomodoro Timer

- Functionality: Timer configurável para sessões de foco profundo
- Purpose: Aumentar concentração e rastrear tempo de trabalho focado
- Trigger: Tap no cartão "Foco" na aba Hoje
- Progression: Tap "Iniciar Foco" → Seleciona preset (25/5, 50/10, custom) → Timer inicia → Notificação ao fim → Opção de break ou próximo pomodoro → Sessão salva → Minutos somam no dashboard
- Success criteria: Timer funciona, sessões são registradas, total de minutos focados aparece em Evolução

### Metas e OKRs

- Functionality: Criar Objetivos com 2-5 Resultados-Chave numéricos, vincular tarefas e hábitos a KRs, atualizar progresso e visualizar status
- Purpose: Conectar ações diárias com aspirações de longo prazo através de métricas claras
- Trigger: Seção "Metas" na aba Planejar
- Progression:
  - Criar: Tap "Nova Meta" → Define objetivo + descrição opcional + prazo opcional → Adiciona 2-5 key results (cada um com: descrição, valor meta, unidade) → Salva
  - Vincular: Ao criar/editar tarefa ou hábito, pode selecionar KR para vincular (tarefas e hábitos podem ter 0 ou 1 KR)
  - Atualizar: Na aba Planejar > Metas, tap no botão "+" ao lado do KR → Digita novo valor atual → Salva → Barra de progresso atualiza
  - Acompanhar: Na aba Evolução, visualiza cada KR com:
    - Barra de progresso (0-100%)
    - Valor atual vs meta
    - Status calculado: "no ritmo" (verde) / "atenção" (amarelo) / "fora do ritmo" (vermelho)
    - Status considera prazo da meta (se definido) ou apenas progresso absoluto
- Success criteria:
  - Metas têm 2-5 KRs obrigatoriamente
  - Tarefas e hábitos podem vincular a 1 KR
  - Progresso de KR atualizável rapidamente
  - Status visual claro (no ritmo/atenção/fora) baseado em progresso e prazo
  - KRs vinculados aparecem na lista de hábitos e tarefas

### Dashboard de Evolução (Minimalista)

- Functionality: Dashboard limpo e discreto com métricas essenciais e acesso às Centrais
- Purpose: Visão rápida do progresso sem sobrecarga visual
- Trigger: Navega para aba Evolução
- Progression: Abre aba → Visualiza cards minimalistas:
  - Metas/KRs: Lista simples com barras de progresso
  - Hábitos: Consistência 7 dias e 30 dias sem julgamento
  - Foco: Minutos focados hoje e na semana
  - Planejamento: Blocos do dia/semana (opcional)
  - Centrais: Lista de módulos ativáveis (Finanças, Leitura, Estudos, Bem-estar, Integrações)
- Success criteria: Interface minimalista sem gráficos pesados, dados claros e objetivos

### Centrais e Feature Flags por Usuário

- Functionality: Sistema de módulos opcionais que podem ser ativados/desativados por usuário
- Purpose: Permitir que cada usuário customize o Acorda com apenas os módulos que precisa
- Trigger: Tap em uma Central na aba Evolução
- Progression:
  - Se módulo está OFF: Mostra tela de ativação com descrição, recursos disponíveis e toggle
  - Se módulo está ON: Abre a Central (Finanças implementada, outras em construção)
  - Toggle ativa/desativa o módulo
  - Módulos desativados não aparecem em outras partes do app
- Módulos disponíveis:
  - **Finanças**: Controle simples de receitas e despesas com registro por texto ou voz ✅ IMPLEMENTADO
  - **Leitura/PDF**: Biblioteca pessoal com livros físicos e leitor de PDF com highlights ✅ IMPLEMENTADO
  - **Estudos/IA**: Flashcards, quizzes e assistente de estudos (em breve)
  - **Bem-estar**: Saúde, exercícios e humor (em breve)
  - **Integrações**: Google Calendar e webhooks (em breve)
- Success criteria:
  - Módulos salvos por usuário em UserSettings
  - Isolamento completo - um usuário não vê módulos de outro
  - Módulos OFF não quebram o app
  - Interface de ativação clara e persuasiva

### Central de Finanças (Módulo Ativável)

- Functionality: Controle financeiro pessoal com registro rápido por texto ou voz, categorização inteligente e visão mensal
- Purpose: Facilitar o controle financeiro diário sem fricção, usando IA para agilizar o registro
- Trigger: Ativa o módulo em Evolução > Centrais > Finanças
- Progression:
  - Ativar: Evolução → Centrais → Finanças → Toggle ON → Abre Central
  - Configurar: Aba "Config" → Criar categorias (Alimentação, Transporte, etc.) → Criar contas (Nubank, Dinheiro, etc.)
  - Registrar gasto (modo chat):
    - Aba "Lançar" → Digite ou fale (ex: "comprei um café por 8 reais")
    - IA processa → Mostra cartão de confirmação com valor, descrição, categoria sugerida e data
    - Usuário confirma (Salvar), edita (botão lápis) ou cancela (X)
    - Após salvar: feedback discreto e lançamento aparece na lista
  - Registrar gasto (voz):
    - Tap botão microfone → Fala → Transcrição automática vira texto
    - Se falhar: cai para input de texto sem quebrar
    - Segue mesmo fluxo de confirmação antes de salvar
  - Visão mensal: Aba "Visão" → Navegar meses → Ver saldo total, receitas, despesas e balanço → Gastos por categoria ordenados
  - Receitas/Despesas fixas: Aba "Fixos" → Ver salários/ganhos recorrentes e contas fixas
- Dados persistidos:
  - FinanceCategory: categorias de receita/despesa
  - FinanceAccount: contas (dinheiro, cartão, etc.)
  - Transaction: lançamentos com metadados de IA (originalText, confidence, aiSuggested)
  - Income: ganhos fixos e variáveis
  - FixedExpense: despesas recorrentes
  - FinanceAuditLog: log de ações assistidas pela IA para transparência
- Segurança/Transparência:
  - NUNCA salvar áudio bruto - apenas texto transcrito
  - Registrar logs de sugestões da IA em FinanceAuditLog
  - Usuário pode ver que lançamento foi sugerido por IA (ícone sparkle)
  - Sempre confirmar antes de salvar (cartão de confirmação obrigatório)
- Success criteria:
  - Registro por texto e voz funcionam
  - IA sugere categoria, valor e data corretamente
  - Cartão de confirmação sempre aparece antes de salvar
  - Fallback para digitação se voz falhar
  - Visão mensal mostra gastos consolidados por categoria
  - Logs de auditoria registram ações da IA
  - Nenhum áudio é salvo no datastore

### Central de Leitura (Módulo Ativável)

- Functionality: Gerenciamento de livros físicos com metas de leitura e leitor de PDF com highlights coloridos
- Purpose: Centralizar leituras, acompanhar progresso de livros físicos e permitir highlights em PDFs sem poluir o armazenamento
- Trigger: Ativa o módulo em Evolução > Centrais > Leitura/PDF
- Progression:
  - Ativar: Evolução → Centrais → Leitura/PDF → Toggle ON → Abre Central com 2 abas (Livros e PDFs)
  - **Livros físicos**:
    - Criar: Tap "Novo Livro" → Preenche título, autor, total de páginas, data início, meta de conclusão → Salva
    - Sistema calcula automaticamente páginas/dia necessárias para atingir a meta
    - Atualizar progresso: Tap "Atualizar" no card do livro → Informa página atual → Opcionalmente adiciona nota → Salva
    - Se leu páginas hoje, cria ReadingLog automático com páginas lidas
    - Visualização: Card mostra progresso (barra), páginas/dia necessárias, páginas lidas hoje (se houver)
    - Status muda automaticamente para "Concluído" quando atinge totalPages
  - **PDFs**:
    - Upload: Tap "Carregar PDF" → Seleciona arquivo PDF local → Sistema extrai metadados (nome, tamanho, total de páginas) → Salva metadados no datastore
    - Armazenamento: PDF bruto fica APENAS em memória do navegador (não persiste no datastore)
    - Abrir: Tap "Abrir" no card do PDF → Abre PDFReader em tela cheia
    - PDFReader:
      - Interface limpa sem poluição visual
      - Navegação: botões anterior/próximo, input direto de página
      - Selecionar texto → Drawer abre automaticamente
      - Escolher cor do highlight (amarelo/verde/azul/rosa/roxo)
      - Adicionar nota opcional ao highlight
      - Tap "Salvar" → Highlight persistido com posição, texto, cor e nota
      - Bottom bar mostra highlights da página atual (se houver)
      - Botão "Marcações" abre drawer com lista de páginas que têm highlights
      - Tap em página com highlight → Navega para essa página
      - Retoma automaticamente na última página lida (currentPage salvo ao fechar)
    - Delete PDF: Remove metadados e todos os highlights associados
- Dados persistidos:
  - Book: título, autor, totalPages, currentPage, startDate, targetEndDate, status, notes
  - ReadingLog: bookId, date, pagesRead, startPage, endPage, notes (registro por dia)
  - PDFDocument: fileName, fileSize, totalPages, currentPage, lastOpenedAt (METADADOS APENAS)
  - PDFHighlight: documentId, pageNumber, text, color, note, position (x, y, width, height)
- Regras de armazenamento:
  - NUNCA salvar arquivo PDF bruto no datastore
  - PDF fica em File object do navegador durante sessão
  - Persistir APENAS: metadados do documento, última página, highlights e notas
  - Cada highlight é um registro separado para escalar
- Success criteria:
  - Livros podem ser criados e atualizados
  - Cálculo de páginas/dia funciona corretamente
  - PDFs podem ser carregados e abertos
  - Highlights com cores funcionam
  - Notas em highlights são salvas
  - Lista de marcações mostra páginas anotadas
  - Navegação clicável para páginas com highlights
  - Retoma leitura na última página
  - Nenhum PDF bruto é salvo no datastore
  - Delete de PDF remove highlights associados

### Central de Estudos (Feature Flag)

- Functionality: Sistema de estudo com técnicas de aprendizagem eficaz e IA
- Purpose: Auxiliar o aprendizado com métodos comprovados e ferramentas inteligentes
- Trigger: Ativar módulo "Estudos" na aba Evolução
- Components:
  - Subjects: Criar e gerenciar assuntos/disciplinas
  - Study Sessions: Registrar sessões de estudo com duração e notas
  - Study Methods Tips: Dicas sobre espaçamento, prática de recuperação, intercalação e elaboração
  - Self-Test Questions: Criar 3 perguntas de auto-teste ao final da sessão
  - AI Recording Sessions: Sessões com transcrição e processamento por IA
- Progression AI Recording:
  - Tap "Sessão com IA" → Solicita consentimento explícito → Usuário aceita/recusa
  - Se aceita: ConsentLog salvo → Área para colar transcrição manualmente
  - Input: assunto, duração, transcrição/notas → Tap "Gerar Resumo e Perguntas com IA"
  - IA processa: gera resumo estilo "meeting notes" + 5 perguntas de revisão
  - Agenda automática de revisão: D+1, D+3, D+7, D+14
  - Salva: transcrição, resumo, perguntas (NÃO áudio bruto)
- Dados persistidos:
  - Subject: name, color, icon
  - StudySession: subjectId, date, duration, quickNotes, selfTestQuestions
  - ConsentLog: consentType, granted, timestamp
  - RecordedStudySession: subjectId, transcription, aiSummary, aiQuestions, reviewSchedule, consentLogId
  - ReviewScheduleItem: recordedSessionId, scheduledDate, completed
- Success criteria:
  - Assuntos podem ser criados
  - Sessões são registradas com duração
  - Dicas de métodos são visíveis
  - Perguntas de auto-teste funcionam
  - Consentimento é solicitado antes de gravar
  - IA gera resumo e perguntas corretamente
  - Agenda de revisão é criada
  - Nenhum áudio bruto é salvo

### Central de Bem-estar (Feature Flag)

- Functionality: Programas estruturados de 7/14/30 dias com check-ins diários
- Purpose: Desenvolver hábitos saudáveis com orientação diária
- Trigger: Ativar módulo "Bem-estar" na aba Evolução
- Programs Available:
  - Sono: Horário fixo, evitar telas, temperatura, cafeína
  - Redução de Tela: Limites, notificações, modo avião, celular fora do quarto
  - Rotina Matinal: Horário fixo, alongamento, café saudável, sem celular
  - Foco: Pomodoro, organização, bloqueio de sites, agrupamento de tarefas
- Progression:
  - Tap "Novo Programa" → Escolhe tipo (sleep/screen_time/morning_routine/focus)
  - Escolhe duração (7/14/30 dias) → Programa inicia
  - Cada dia mostra 1-3 micro-ações específicas
  - Check-in diário: horas de sono (slider 0-12h), energia (low/medium/high), humor (low/medium/high), notas opcionais
  - Marca micro-ações como concluídas → Progresso visual
- Copy Cuidadosa:
  - Disclaimer visível: "Não é conselho médico profissional"
  - Sem promessas de cura ou resultados garantidos
  - Foco em práticas saudáveis comuns
- Dados persistidos:
  - WellnessProgram: type, duration, startDate, isActive, currentDay
  - WellnessCheckIn: date, sleepHours, energyLevel, mood, notes
  - WellnessDayAction: programId, day, action, completed
- Success criteria:
  - Programas podem ser iniciados
  - Micro-ações são exibidas por dia
  - Check-in diário funciona
  - Disclaimer está visível
  - Progresso é rastreado
  - Copy não faz promessas médicas

### Integrações e Privacidade (Feature Flag)

- Functionality: Google Calendar + Exportação de dados + Gestão de privacidade
- Purpose: Conectar ferramentas externas e dar controle total sobre dados
- Trigger: Ativar módulo "Integrações" na aba Evolução
- Components:
  - Google Calendar Integration:
    - Tela conectar/desconectar
    - Importa eventos como somente leitura
    - Alertas de conflito com CalendarBlocks internos
    - Modo manual como alternativa (OAuth não disponível neste ambiente)
  - Privacy Settings:
    - Explicação clara do que é armazenado vs local
    - Lista: tarefas, metas, transações, livros, estudos, check-ins armazenados
    - Lista: PDFs e áudios ficam locais (não salvos)
  - Data Export:
    - Finanças: CSV com data, tipo, descrição, categoria, valor
    - Estudos: Markdown com sessões, notas, resumos, perguntas
    - Leitura: Markdown com livros, highlights, notas
  - Data Deletion:
    - Botão "Apagar Todos os Meus Dados"
    - Confirmação com input "APAGAR"
    - Remove todos os registros do userId
    - Ação irreversível com aviso claro
- Progression Export:
  - Tap "Exportar Finanças" → Gera CSV → Download automático
  - Tap "Exportar Estudos" → Gera Markdown → Download automático
  - Tap "Exportar Leitura" → Gera Markdown → Download automático
- Progression Delete:
  - Tap "Apagar Meus Dados" → Dialog confirmar
  - Digite "APAGAR" → Valida → Remove todos os dados do userId
  - Recarrega página → Estado limpo
- Dados persistidos:
  - GoogleCalendarConnection: connected, connectedAt, lastSyncAt
  - GoogleCalendarEvent: googleEventId, title, date, time, isReadOnly
  - DataExport: exportType, status, createdAt
  - ConsentLog: para auditoria de consentimentos
- Success criteria:
  - Google Calendar mostra modo manual como alternativa
  - Explicação de privacidade está clara
  - Exportações geram arquivos corretos
  - Delete apaga todos os dados do usuário
  - Confirmação funciona corretamente


## Edge Case Handling

- **Usuário não autenticado**: Mostra tela de boas-vindas com CTA para login GitHub
- **Inbox vazia**: Estado vazio encorajador "Você está em dia! ✨"
- **Sem tarefas**: Estado vazio "Nenhuma tarefa criada. Capture algo para começar."
- **Sem hábitos**: Estado vazio "Crie seu primeiro hábito para começar a evoluir"
- **Timer em segundo plano**: Salva estado do timer para não perder progresso se sair do app
- **Data/hora inválida**: Valida inputs de calendário e mostra feedback claro
- **Limite de Top 3**: Bloqueia adição de 4ª prioridade com mensagem "Foque em no máximo 3"
- **Sem metas**: Estado vazio "Defina sua primeira meta para conectar ações com propósito"

## Data Model & Architecture

### Princípios Fundamentais

- Todo registro possui: `id`, `userId`, `createdAt`, `updatedAt` para rastreabilidade
- Isolamento absoluto por `userId` - nenhuma consulta cruza usuários
- Registros pequenos e atômicos - logs/highlights são entidades separadas
- Status padronizados baseados em GTD: `inbox`, `next`, `scheduled`, `waiting`, `someday`, `done`

### Entidades Core

### UserSettings

```typescript
{
  id: string
  userId: number
  weekStartsOn: 0 | 1              // Domingo ou Segunda
  defaultPomodoroPreset?: string   // ID do preset preferido
  minimalMode: boolean             // Modo interface mínima
  modules: {                       // Feature flags por usuário
    financas: boolean
    leitura: boolean
    estudos: boolean
    bemestar: boolean
    integracoes: boolean
  }
  createdAt: number
  updatedAt: number
}

```

**InboxItem** - Captura rápida GTD

```typescript
{
  id: string
  userId: number
  content: string                  // Texto capturado
  notes?: string                   // Notas adicionais
  isProcessed: boolean             // Marca se já foi processado
  processedAt?: number             // Timestamp do processamento
  createdAt: number
  updatedAt: number
}

```

**Task** - Ações executáveis

```typescript
{
  id: string
  userId: number
  title: string
  description?: string
  status: 'inbox' | 'next' | 'scheduled' | 'waiting' | 'someday' | 'done'
  tags: string[]                   // Contextos GTD
  energyLevel?: 'low' | 'medium' | 'high'
  estimateMin?: number             // Estimativa de duração
  projectId?: string               // Vinculo com projeto
  scheduledDate?: string           // YYYY-MM-DD
  isTopPriority: boolean           // Top 3 do dia
  isTwoMinuteTask: boolean         // Marcada pela regra dos 2 minutos
  notes?: string                   // Notas adicionais
  completedAt?: number
  createdAt: number
  updatedAt: number
}

```

**Project** - Agrupador de tarefas

```typescript
{
  id: string
  userId: number
  name: string
  description?: string
  status: 'active' | 'archived' | 'completed'
  tags: string[]
  createdAt: number
  updatedAt: number
}

```

**CalendarBlock** - Time blocking

```typescript
{
  id: string
  userId: number
  title: string
  description?: string
  date: string                     // YYYY-MM-DD
  startTime: number                // Minutos desde meia-noite
  endTime: number
  type: 'task' | 'habit' | 'focus' | 'meeting' | 'personal'
  taskId?: string
  habitId?: string
  createdAt: number
  updatedAt: number
}

```

**Goal** - Objetivos OKR

```typescript
{
  id: string
  userId: number
  objective: string
  description?: string
  deadline?: number
  status: 'active' | 'achieved' | 'abandoned'
  createdAt: number
  updatedAt: number
}

```

**KeyResult** - Resultados-chave mensuráveis

```typescript
{
  id: string
  userId: number
  goalId: string
  description: string
  targetValue: number
  currentValue: number
  unit: string                     // "km", "horas", "vezes"
  createdAt: number
  updatedAt: number
}

```

**Habit** - Comportamentos recorrentes

```typescript
{
  id: string
  userId: number
  name: string
  description?: string
  frequency: 'daily' | 'weekly'
  targetDays?: number[]            // [0,2,4] = Dom, Ter, Qui
  isActive: boolean
  createdAt: number
  updatedAt: number
}

```

**HabitLog** - Registro de conclusão (entidade separada para escalar)

```typescript
{
  id: string
  userId: number
  habitId: string
  date: string                     // YYYY-MM-DD
  completedAt: number
  notes?: string
}

```

**PomodoroPreset** - Configurações de timer

```typescript
{
  id: string
  userId: number
  name: string
  focusDuration: number            // Minutos
  breakDuration: number
  longBreakDuration: number
  sessionsBeforeLongBreak: number
  isDefault: boolean
  createdAt: number
  updatedAt: number
}

```

**PomodoroSession** - Sessão de foco (entidade separada para análise)

```typescript
{
  id: string
  userId: number
  presetId?: string
  taskId?: string
  date: string                     // YYYY-MM-DD
  startedAt: number
  completedAt?: number
  duration: number                 // Segundos
  type: 'focus' | 'break' | 'longBreak'
  interrupted: boolean
}

```

**FinanceCategory** - Categorias de receitas e despesas

```typescript
{
  id: string
  userId: number
  name: string                     // "Alimentação", "Transporte", etc
  type: 'income' | 'expense'
  color?: string
  icon?: string
  createdAt: number
  updatedAt: number
}

```

**FinanceAccount** - Contas financeiras (carteira, banco, etc)

```typescript
{
  id: string
  userId: number
  name: string                     // "Nubank", "Dinheiro", etc
  type: 'cash' | 'checking' | 'credit' | 'savings' | 'investment'
  balance: number
  color?: string
  icon?: string
  createdAt: number
  updatedAt: number
}

```

**Transaction** - Lançamentos financeiros

```typescript
{
  id: string
  userId: number
  type: 'income' | 'expense' | 'transfer'
  amount: number
  date: string                     // YYYY-MM-DD
  categoryId?: string
  accountId: string
  description: string
  notes?: string
  isRecurring: boolean
  parentTransactionId?: string     // Para recorrências
  aiSuggested?: boolean            // Se foi sugerido por IA
  aiMetadata?: {                   // Metadados de IA para auditoria
    originalText?: string
    confidence?: number
    suggestedCategoryId?: string
  }
  createdAt: number
  updatedAt: number
}

```

**Income** - Receitas fixas e variáveis

```typescript
{
  id: string
  userId: number
  name: string
  amount: number
  type: 'fixed' | 'variable'
  categoryId?: string
  accountId: string
  frequency?: 'monthly' | 'weekly' | 'biweekly' | 'yearly'
  dayOfMonth?: number
  isActive: boolean
  createdAt: number
  updatedAt: number
}

```

**FixedExpense** - Despesas fixas recorrentes

```typescript
{
  id: string
  userId: number
  name: string
  amount: number
  categoryId: string
  accountId: string
  frequency: 'monthly' | 'weekly' | 'biweekly' | 'yearly'
  dayOfMonth?: number
  isActive: boolean
  createdAt: number
  updatedAt: number
}

```

**Book** - Livros físicos com metas de leitura

```typescript
{
  id: string
  userId: number
  title: string
  author: string
  totalPages: number
  currentPage: number
  startDate: string                // YYYY-MM-DD
  targetEndDate: string            // YYYY-MM-DD
  status: 'reading' | 'completed' | 'paused'
  notes?: string
  createdAt: number
  updatedAt: number
}

```

**ReadingLog** - Registro de leitura por dia (entidade separada para escalar)

```typescript
{
  id: string
  userId: number
  bookId: string
  date: string                     // YYYY-MM-DD
  pagesRead: number
  startPage: number
  endPage: number
  notes?: string
  createdAt: number
}

```

**PDFDocument** - Metadados de documentos PDF (NÃO o arquivo bruto)

```typescript
{
  id: string
  userId: number
  fileName: string
  fileSize: number                 // Bytes
  totalPages: number
  currentPage: number
  lastOpenedAt?: number
  createdAt: number
  updatedAt: number
}

```

**PDFHighlight** - Marcações em PDFs (entidade separada para escalar)

```typescript
{
  id: string
  userId: number
  documentId: string
  pageNumber: number
  text: string                     // Texto selecionado
  color: 'yellow' | 'green' | 'blue' | 'pink' | 'purple'
  note?: string                    // Nota opcional
  position: {                      // Posição do highlight (simplificada)
    x: number
    y: number
    width: number
    height: number
  }
  createdAt: number
  updatedAt: number
}

```

**Subject** - Assuntos/disciplinas para estudo

```typescript
{
  id: string
  userId: number
  name: string
  color?: string
  icon?: string
  createdAt: number
  updatedAt: number
}

```

**StudySession** - Sessões de estudo registradas

```typescript
{
  id: string
  userId: number
  subjectId: string
  date: string                     // YYYY-MM-DD
  startTime: number
  endTime?: number
  durationMinutes: number
  quickNotes?: string
  selfTestQuestions?: string[]     // Perguntas de auto-teste
  createdAt: number
  updatedAt: number
}

```

**ConsentLog** - Registro de consentimentos para privacidade

```typescript
{
  id: string
  userId: number
  consentType: 'audio_recording' | 'ai_processing' | 'data_export'
  granted: boolean
  timestamp: number
  ipAddress?: string
}

```

**RecordedStudySession** - Sessões com gravação e IA

```typescript
{
  id: string
  userId: number
  subjectId: string
  date: string
  durationMinutes: number
  transcription?: string           // Transcrição do áudio (NÃO o áudio bruto)
  aiSummary?: string               // Resumo gerado por IA
  aiQuestions?: string[]           // 5 perguntas geradas por IA
  reviewSchedule?: number[]        // [1, 3, 7, 14] dias para revisão
  consentLogId: string             // Referência ao consentimento
  createdAt: number
  updatedAt: number
}

```

**ReviewScheduleItem** - Agenda de revisão espaçada

```typescript
{
  id: string
  userId: number
  recordedSessionId: string
  scheduledDate: string            // YYYY-MM-DD
  completed: boolean
  completedAt?: number
  notes?: string
  createdAt: number
  updatedAt: number
}

```

**WellnessProgram** - Programas de bem-estar

```typescript
{
  id: string
  userId: number
  type: 'sleep' | 'screen_time' | 'morning_routine' | 'focus'
  duration: 7 | 14 | 30            // Duração do programa em dias
  startDate: string                // YYYY-MM-DD
  isActive: boolean
  currentDay: number
  createdAt: number
  updatedAt: number
}

```

**WellnessCheckIn** - Check-in diário de bem-estar

```typescript
{
  id: string
  userId: number
  date: string                     // YYYY-MM-DD
  sleepHours?: number
  energyLevel?: 'low' | 'medium' | 'high'
  mood?: 'low' | 'medium' | 'high'
  notes?: string
  createdAt: number
}

```

**WellnessDayAction** - Micro-ações dos programas

```typescript
{
  id: string
  programId: string
  day: number                      // Dia do programa (1-30)
  action: string                   // Descrição da micro-ação
  completed: boolean
  completedAt?: number
}

```

**GoogleCalendarConnection** - Conexão com Google Calendar

```typescript
{
  id: string
  userId: number
  connected: boolean
  connectedAt?: number
  disconnectedAt?: number
  lastSyncAt?: number
  accessToken?: string             // Não usado neste ambiente
  refreshToken?: string            // Não usado neste ambiente
  createdAt: number
  updatedAt: number
}

```

**GoogleCalendarEvent** - Eventos importados (somente leitura)

```typescript
{
  id: string
  userId: number
  googleEventId: string
  title: string
  description?: string
  startTime: number
  endTime: number
  date: string                     // YYYY-MM-DD
  isReadOnly: true                 // Sempre true para eventos externos
  lastSyncedAt: number
}

```

**DataExport** - Registro de exportações de dados

```typescript
{
  id: string
  userId: number
  exportType: 'finance_csv' | 'study_markdown' | 'reading_markdown' | 'full_data'
  status: 'pending' | 'completed' | 'failed'
  data?: string
  createdAt: number
  completedAt?: number
}

```

**FinanceAuditLog** - Log de auditoria de ações assistidas por IA

```typescript
{
  id: string
  userId: number
  action: string                   // "ai_suggestion_generated", "transaction_saved_from_ai"
  entityType: 'transaction' | 'category' | 'account' | 'income' | 'expense'
  entityId: string
  metadata?: {
    aiSuggestion?: string
    userModification?: string
    originalText?: string
  }
  createdAt: number
}

```

**Queries Úteis** (implementadas em `/lib/queries.ts`):

- `getTasksForToday(tasks, date)` - Tarefas agendadas + top priorities
- `getTasksByStatus(tasks, userId, status)` - Filtra por status GTD
- `getTopPriorities(tasks, userId)` - Máximo 3 prioridades ativas
- `getCalendarBlocksForDay(blocks, userId, date)` - Agenda do dia ordenada
- `getHabitsForDay(habits, logs, userId, date)` - Hábitos + status de conclusão
- `getHabitStreak(logs, userId, habitId)` - Dias consecutivos
- `getKeyResultProgress(kr)` - Percentual 0-100
- `getGoalProgress(goal, keyResults, userId)` - Média de KRs
- `getPomodoroSessionsForDay(sessions, userId, date)` - Sessões do dia
- `getTotalFocusMinutes(sessions, userId, date)` - Soma de minutos focados
- `getCompletedTasksForDay(tasks, userId, date)` - Tarefas concluídas hoje

**Helpers de Criação** (implementados em `/lib/helpers.ts`):

- `createInboxItem(userId, content, notes?)` - Factory para inbox
- `createTask(userId, title, options)` - Factory com defaults
- `createGoal(userId, objective, description?, deadline?)`
- `createKeyResult(userId, goalId, description, targetValue, unit)`
- `createHabit(userId, name, frequency, options)`
- `createHabitLog(userId, habitId, date, notes?)`
- `createPomodoroSession(userId, type, duration, options)`
- `createFinanceCategory(userId, name, type, options)` - Factory para categoria financeira
- `createFinanceAccount(userId, name, type, options)` - Factory para conta financeira
- `createTransaction(userId, type, amount, date, accountId, description, options)` - Factory para transação
- `createIncome(userId, name, amount, type, accountId, options)` - Factory para receita fixa
- `createFixedExpense(userId, name, amount, categoryId, accountId, frequency, options)` - Factory para despesa fixa
- `createFinanceAuditLog(userId, action, entityType, entityId, metadata?)` - Factory para log de auditoria
- `createBook(userId, title, author, totalPages, startDate, targetEndDate, options)` - Factory para livro
- `createReadingLog(userId, bookId, date, pagesRead, startPage, endPage, notes?)` - Factory para log de leitura
- `createPDFDocument(userId, fileName, fileSize, totalPages)` - Factory para metadados de PDF
- `createPDFHighlight(userId, documentId, pageNumber, text, color, position, note?)` - Factory para highlight
- `calculateDailyPages(totalPages, currentPage, targetEndDate)` - Calcula páginas/dia necessárias
- `formatFileSize(bytes)` - Formata tamanho de arquivo (KB, MB)
- `formatCurrency(amount)` - Formata número para moeda BRL
- `getMonthKey(date)` - Retorna chave YYYY-MM para agrupar por mês
- `parseMonthKey(monthKey)` - Converte YYYY-MM para Date
- `updateTimestamp(entity)` - Atualiza `updatedAt` automaticamente
- `createSubject(userId, name, options)` - Factory para assunto/disciplina
- `createStudySession(userId, subjectId, date, startTime, durationMinutes, options)` - Factory para sessão de estudo
- `createConsentLog(userId, consentType, granted, ipAddress?)` - Factory para log de consentimento
- `createRecordedStudySession(userId, subjectId, date, durationMinutes, consentLogId, options)` - Factory para sessão com IA
- `createReviewScheduleItem(userId, recordedSessionId, scheduledDate)` - Factory para item de revisão
- `createWellnessProgram(userId, type, duration, startDate)` - Factory para programa de bem-estar
- `createWellnessCheckIn(userId, date, options)` - Factory para check-in diário
- `createGoogleCalendarConnection(userId)` - Factory para conexão do Google Calendar
- `getWellnessProgramActions(type, day)` - Retorna ações do dia para um programa
- `addDaysToDate(dateStr, days)` - Adiciona dias a uma data string


## Design Direction

A interface deve evocar calm technology - tecnologia que desaparece quando não é necessária. Minimalismo japonês: espaço em branco generoso, tipografia expressiva mas contida, cores funcionais que comunicam estado sem gritar. A experiência deve ser rápida, fluida e criar sensação de "flow" - não de trabalho extra.

## Color Selection

Paleta terrosa e calma que não compete por atenção, apenas guia.

- **Primary Color**: `oklch(0.45 0.08 180)` - Verde-azulado profundo que transmite crescimento, confiança e foco
- **Secondary Colors**: `oklch(0.92 0.01 180)` - Cinza quente ultra-claro para fundos de seções
- **Accent Color**: `oklch(0.70 0.15 140)` - Verde vibrante para checks, confirmações e progresso positivo
- **Foreground/Background Pairings**:
  - Background (Bege claro `oklch(0.98 0.01 85)`): Texto escuro (`oklch(0.25 0.01 85)`) - Ratio 14.2:1 ✓
  - Primary (Verde-azulado `oklch(0.45 0.08 180)`): White text (`oklch(1 0 0)`) - Ratio 7.8:1 ✓
  - Accent (Verde `oklch(0.70 0.15 140)`): Dark text (`oklch(0.25 0.01 85)`) - Ratio 9.1:1 ✓

## Font Selection

Tipografia que respira - generosa em espaçamento, clara em hierarquia. Uso de Instrument Sans para UI (geométrica, moderna, humanista) e DM Mono para números e timers (monospace precisa mas amigável).

- **Typographic Hierarchy**:
  - H1 (Nome das abas): Instrument Sans Medium/20px/tight tracking
  - H2 (Seções): Instrument Sans SemiBold/16px/normal tracking
  - Body (Listas): Instrument Sans Regular/15px/relaxed line-height
  - Caption (Metadados): Instrument Sans Regular/13px/muted color
  - Timer/Numbers: DM Mono Medium/32px/tabular nums

## Animations

Animações devem ser quase imperceptíveis - just enough para criar continuidade espacial. Transitions suaves (200-300ms) em mudanças de estado, spring physics suave em modals/sheets (sem bounce exagerado). Check de tarefas e hábitos com micro-celebração (escala + fade). Tab switching sem animação ou com fade mínimo.

## Component Selection

- **Components**:
  - Bottom Navigation: Custom com 3 tabs fixos (Hoje/Planejar/Evolução)
  - FAB: Button com position fixed, shadcn Button variant "default" customizado
  - Sheets: shadcn Sheet para captura rápida e triagem
  - Dialogs: shadcn Dialog para edição de tarefas/metas
  - Cards: shadcn Card para Top 3, Foco, Dashboard metrics
  - Lists: Custom com shadcn Checkbox para hábitos/tarefas
  - Tabs: shadcn Tabs para subnavegação em Planejar
  - Progress: shadcn Progress para KRs e metas
  - Calendar: Custom grid para visualização semanal
  - Timer Display: Custom com DM Mono

- **Customizations**:
  - BottomNav custom com indicador sutil
  - FAB com shadow pronunciada e pulse suave
  - CalendarGrid custom para time blocking
  - PomodoroTimer custom com arc progress

- **States**:
  - Buttons: hover com lift suave, active com scale down, disabled com opacity 40%
  - Checkboxes: check com scale spring, unchecked com border muted
  - Inputs: focus com ring accent, filled com background subtle
  - Cards: hover com border accent em itens clicáveis

- **Icon Selection**:
  - @phosphor-icons/react: CheckCircle (conclusão), Plus (adicionar), Target (metas), Calendar (planejar), TrendUp (evolução), Timer (Pomodoro), ListChecks (hábitos)

- **Spacing**:
  - Container padding: p-4 (mobile), p-6 (desktop)
  - Section gaps: gap-6 (mobile), gap-8 (desktop)
  - List items: gap-2
  - Cards: p-4 internamente

- **Mobile**:
  - Bottom nav sticky com safe area
  - FAB com 16px de margem bottom (acima do nav)
  - Sheets que ocupam 90% da altura
  - Touch targets mínimo 44px
  - Swipe gestures para marcar tarefas (futuro)
  - Single column em tudo
