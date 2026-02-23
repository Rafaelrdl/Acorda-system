# 🧪 Guia de Teste Manual Completo — Acorda System

> **Objetivo:** Validar TODAS as funcionalidades do sistema de ponta a ponta.
> **Tempo estimado:** ~90 minutos seguindo este roteiro com os valores sugeridos.
> **Dica:** Copie e cole os valores sugeridos para acelerar o preenchimento.

---

## Índice

1. [Autenticação](#1-autenticação)
2. [Onboarding](#2-onboarding)
3. [Quick Capture (Inbox)](#3-quick-capture-inbox)
4. [Processar Inbox (GTD)](#4-processar-inbox-gtd)
5. [Tarefas](#5-tarefas)
6. [Projetos](#6-projetos)
7. [Metas e Key Results](#7-metas-e-key-results)
8. [Hábitos](#8-hábitos)
9. [Calendário / Blocos](#9-calendário--blocos)
10. [Pomodoro](#10-pomodoro)
11. [Anotações Diárias](#11-anotações-diárias)
12. [Finanças](#12-finanças)
13. [Leitura](#13-leitura)
14. [Estudos](#14-estudos)
15. [Bem-estar](#15-bem-estar)
16. [Treino](#16-treino)
17. [Dieta](#17-dieta)
18. [Configurações e Perfil](#18-configurações-e-perfil)
19. [Exportação de Dados](#19-exportação-de-dados)
20. [Evolução (Dashboard)](#20-evolução-dashboard)
21. [Landing Page e Checkout](#21-landing-page-e-checkout)
22. [PWA e Responsividade](#22-pwa-e-responsividade)

---

## 1. Autenticação

### 1.1 Registro / Criação de Conta

> Acesse a landing page e clique em "Começar Gratuitamente" ou "Criar conta".

| Campo | Valor sugerido |
|-------|---------------|
| Nome | `Teste QA` |
| Email | `teste-qa@acorda.app` |
| Senha | `Teste@2024!` |
| Confirmar Senha | `Teste@2024!` |

**Validações esperadas:**
- [ ] Senha mínima 8 caracteres → tente `123` e veja o erro
- [ ] E-mail inválido → tente `teste@` e veja o erro
- [ ] Senhas diferentes → tente `Teste@2024!!` na confirmação e veja o erro
- [ ] Registro com sucesso → redireciona para onboarding ou dashboard
- [ ] E-mail de ativação enviado (cheque o console ou e-mail)

### 1.2 Login

| Campo | Valor sugerido |
|-------|---------------|
| Email | `teste-qa@acorda.app` |
| Senha | `Teste@2024!` |

**Validações esperadas:**
- [x] Login com sucesso → redireciona para o app
- [x] Credenciais erradas → exibe mensagem de erro
- [x] "Esqueci minha senha" → abre tela de redefinição

### 1.3 Esqueci a Senha

| Campo | Valor sugerido |
|-------|---------------|
| Email | `teste-qa@acorda.app` |

**Validações esperadas:**
- [ ] E-mail de redefinição enviado
- [ ] Link de redefinição funciona

### 1.4 Redefinir Senha

| Campo | Valor sugerido |
|-------|---------------|
| Nova Senha | `NovaSenha@2024!` |
| Confirmar Nova Senha | `NovaSenha@2024!` |

**Validações esperadas:**
- [x] Senha redefinida com sucesso
- [x] Validação de mínimo 8 caracteres
- [x] Validação de senhas coincidentes

---

## 2. Onboarding

> Após o primeiro login, o fluxo de onboarding aparece automaticamente.
> São **6 etapas**: welcome → goal → habits → tour → modules → ready

### Etapa 1: Welcome (Boas-vindas)
- [ ] Tela informativa exibida
- [ ] Botão "Avançar" funciona

### Etapa 2: Goal (Meta inicial)
- [ ] Permite definir uma meta inicial
- **Sugestão:** Selecione qualquer opção pré-definida

### Etapa 3: Habits (Hábitos)
- [ ] Permite selecionar hábitos sugeridos
- **Sugestão:** Marque 3 hábitos (ex: Meditar, Exercitar, Ler)

### Etapa 4: Tour (Guia visual)
- [ ] Exibe tour guiado pelas funcionalidades
- [ ] Botão "Avançar" funciona

### Etapa 5: Modules (Módulos)
- [ ] Permite ativar/desativar módulos (Finanças, Leitura, Estudos, Bem-estar, Treino, Dieta)
- **Sugestão:** Ative todos os 6 módulos

### Etapa 6: Ready (Pronto)
- [ ] Exibe mensagem de conclusão
- [ ] Botão "Começar" redireciona para o app principal
- [ ] Onboarding não aparece em logins futuros

**Validação extra:**
- [ ] Indicador de progresso (dots/steps) reflete o passo atual
- [ ] Botão "Voltar" funciona em todos os passos

---

## 3. Quick Capture (Inbox)

> Clique no FAB (botão flutuante "+" ) ou use o campo Quick Capture na aba Coletar.

### 3.1 Captura rápida simples

| Campo | Valor sugerido |
|-------|---------------|
| Input principal | `Comprar presente de aniversário da Maria` |

- [ ] Enter envia para Inbox
- [ ] Item aparece na lista do Inbox
- [ ] Campo limpa após envio

### 3.2 Captura com detalhes (expandir)

| Campo | Valor sugerido |
|-------|---------------|
| Input principal | `Pesquisar cursos de React avançado` |
| Detalhes | `Ver Udemy, Frontendmasters e Egghead. Comparar preços e conteúdo.` |

- [ ] Detalhes salvos com o item
- [ ] Item aparece no Inbox com os detalhes

### 3.3 Criar mais itens para teste (copie e cole cada um):

```
Ligar para dentista marcar consulta
Revisar relatório mensal
Comprar café e leite
Organizar fotos do celular
Cancelar assinatura da Netflix
Ler artigo sobre produtividade
Enviar e-mail para fornecedor
```

- [ ] Todos os 7 itens aparecem no Inbox

---

## 4. Processar Inbox (GTD)

> Na aba "Coletar", clique no botão de processar em um item do Inbox.
> O processo segue o fluxo GTD: É acionável? → Sim/Não → Destino → Detalhes

### 4.1 Item NÃO acionável → Referência

**Item:** `Ler artigo sobre produtividade`

1. "É acionável?" → Escolha **Não**
2. Escolha **"Referência"**
3. Salve

- [ ] Item removido do Inbox
- [ ] Aparece nas Referências

### 4.2 Item NÃO acionável → Lixo

**Item:** `Cancelar assinatura da Netflix`

1. "É acionável?" → Escolha **Não**
2. Escolha **"Lixo/Excluir"**

- [ ] Item removido do Inbox e descartado

### 4.3 Item acionável → Próxima Ação

**Item:** `Ligar para dentista marcar consulta`

1. "É acionável?" → Escolha **Sim**
2. "É a próxima ação?" → Escolha **Sim**
3. Destino: **"Próxima Ação"** (next)

- [ ] Item vira tarefa com status `next`
- [ ] Aparece na aba "Planejar" em "Próximas Ações"

### 4.4 Item acionável → Agendado

**Item:** `Revisar relatório mensal`

1. "É acionável?" → Escolha **Sim**
2. Destino: **"Agendar"** (scheduled)
3. Selecione uma data futura (ex: próxima segunda-feira)

| Campo | Valor sugerido |
|-------|---------------|
| Data | Próxima segunda-feira |
| Horário | `09:00` |
| Duração | `60 min` |

- [ ] Item vira tarefa com status `scheduled`
- [ ] Aparece no calendário na data correta

### 4.5 Item acionável → Algum dia/Talvez

**Item:** `Organizar fotos do celular`

1. "É acionável?" → Escolha **Sim**
2. Destino: **"Algum Dia/Talvez"** (someday)

- [ ] Item vira tarefa com status `someday`

### 4.6 Item acionável → Aguardando

**Item:** `Enviar e-mail para fornecedor`

1. "É acionável?" → Escolha **Sim**
2. Destino: **"Aguardando"** (waiting)

- [ ] Item vira tarefa com status `waiting`

### 4.7 Criar tarefa com detalhes completos

**Item:** `Comprar presente de aniversário da Maria`

1. "É acionável?" → **Sim**
2. Destino: **Próxima Ação**
3. Na tela de detalhes, preencha:

| Campo | Valor sugerido |
|-------|---------------|
| Energia | `medium` (Média) |
| Estimativa (min) | `30` |
| Tags | `pessoal` |

- [ ] Tarefa criada com todos os campos preenchidos

---

## 5. Tarefas

> Na aba "Planejar", clique no "+" para criar nova tarefa.

### 5.1 Criar Tarefa

| Campo | Valor sugerido |
|-------|---------------|
| Título | `Preparar apresentação do projeto Alpha` |
| Descrição | `Slides com métricas Q4. Incluir gráficos de receita e retenção.` |
| Status | `next` (Próxima Ação) |
| Energia | `high` (Alta) |
| Estimativa (min) | `90` |
| Projeto | (selecione depois de criar um projeto) |
| Tags | `trabalho, urgente` |

- [ ] Tarefa criada com sucesso
- [ ] Aparece na lista "Próximas Ações"

### 5.2 Criar Tarefa Agendada

| Campo | Valor sugerido |
|-------|---------------|
| Título | `Reunião com equipe de marketing` |
| Descrição | `Pauta: campanha de lançamento Q1` |
| Status | `scheduled` (Agendada) |
| Data agendada | Amanhã |
| Energia | `medium` |
| Estimativa (min) | `45` |
| Tags | `trabalho, meeting` |

- [ ] Tarefa aparece no calendário
- [ ] Data correta exibida

### 5.3 Editar Tarefa
- [ ] Clique em uma tarefa existente → abre dialog de edição
- [ ] Altere o título para `Preparar apresentação ATUALIZADA do projeto Alpha`
- [ ] Salve → verifique se reflete a mudança

### 5.4 Concluir Tarefa
- [ ] Marque o checkbox de uma tarefa → status muda para `done`
- [ ] Tarefa move para aba/seção "Concluídas"

### 5.5 Deletar Tarefa
- [ ] Use a ação de deletar em uma tarefa
- [ ] Tarefa some da lista

### 5.6 Filtros e Agrupamentos
- [ ] Filtre por energia (alta/média/baixa)
- [ ] Filtre por tag
- [ ] Agrupe por projeto

---

## 6. Projetos

> Na aba "Planejar", seção de Projetos, clique em "+" para criar.

### 6.1 Criar Projeto

| Campo | Valor sugerido |
|-------|---------------|
| Nome | `Lançamento App Mobile` |
| Descrição | `MVP do aplicativo mobile com React Native` |
| Status | `active` (Ativo) |
| Prazo | Daqui 30 dias |
| Tags | `trabalho, tech` |

- [ ] Projeto criado com sucesso
- [ ] Aparece na lista de projetos

### 6.2 Segundo Projeto (para teste de agrupamento)

| Campo | Valor sugerido |
|-------|---------------|
| Nome | `Reforma do escritório` |
| Descrição | `Pintura, móveis novos e organização` |
| Status | `active` |
| Tags | `pessoal, casa` |

- [ ] Projeto criado
- [ ] Tarefas podem ser vinculadas a este projeto

### 6.3 Vincular Tarefa a Projeto
- [ ] Edite a tarefa "Preparar apresentação..." e selecione o projeto "Lançamento App Mobile"
- [ ] Tarefa aparece agrupada sob o projeto

### 6.4 Arquivar Projeto
- [ ] Mude o status do projeto "Reforma do escritório" para `archived`
- [ ] Projeto move para seção de arquivados

---

## 7. Metas e Key Results

> Na aba "Planejar", seção Metas, clique em "+" para criar.

### 7.1 Criar Meta

| Campo | Valor sugerido |
|-------|---------------|
| Objetivo | `Melhorar condicionamento físico` |
| Descrição | `Foco em saúde cardiovascular e força muscular para o próximo trimestre` |
| Prazo | Daqui 90 dias |

**Key Results (adicione 3):**

| KR # | Valor sugerido |
|-------|---------------|
| KR 1 | `Correr 3x por semana` |
| KR 2 | `Treinar musculação 4x por semana` |
| KR 3 | `Dormir pelo menos 7h por noite` |

- [ ] Meta criada com 3 KRs
- [ ] Barra de progresso mostra 0%

### 7.2 Segunda Meta

| Campo | Valor sugerido |
|-------|---------------|
| Objetivo | `Ler 12 livros este ano` |
| Descrição | `1 livro por mês, alternando entre ficção e não-ficção` |
| Prazo | Final do ano |
| KR 1 | `Ler pelo menos 20 páginas por dia` |
| KR 2 | `Fazer anotações de cada livro` |

- [ ] Meta criada com sucesso

### 7.3 Atualizar Progresso de um Key Result
- [ ] Clique em um KR para atualizar o progresso (ex: 30%)
- [ ] Barra de progresso da meta atualiza automaticamente

### 7.4 Marcar Meta como concluída
- [ ] Mude status para `achieved`
- [ ] Meta move para seção concluídas

---

## 8. Hábitos

> Na aba "Planejar", seção Hábitos, clique em "+" para criar.

### 8.1 Criar Hábito Diário

| Campo | Valor sugerido |
|-------|---------------|
| Nome | `Meditar` |
| Descrição | `Sessão de mindfulness pela manhã` |
| Versão Mínima | `5 minutos` |
| Frequência | `Diária` |

- [ ] Hábito criado
- [ ] Aparece no tracker diário

### 8.2 Criar Hábito Semanal

| Campo | Valor sugerido |
|-------|---------------|
| Nome | `Correr no parque` |
| Descrição | `Corrida leve de 5km` |
| Versão Mínima | `2km caminhando` |
| Frequência | `Semanal` |
| Dias | Marque: **Seg**, **Qua**, **Sex** |

- [ ] Hábito criado com dias específicos
- [ ] Aparece apenas nos dias selecionados

### 8.3 Mais Hábitos (copie rapidamente)

| Nome | Versão Mínima | Frequência |
|------|--------------|-----------|
| `Ler 30min` | `5 páginas` | Diária |
| `Beber 2L de água` | `1 copo` | Diária |
| `Estudar inglês` | `10 minutos no Duolingo` | Diária |

### 8.4 Marcar Hábito como feito
- [ ] Na aba "Hoje", clique no hábito "Meditar" para marcar como feito
- [ ] Check visual aparece
- [ ] Streak incrementa

### 8.5 Desmarcar Hábito
- [ ] Clique novamente para desmarcar
- [ ] Check some, streak ajusta

### 8.6 Verificar Sugestões de Hábitos
- [ ] No dialog de criar hábito, verifique se botão de sugestões existe
- [ ] Clique e veja categorias de hábitos sugeridos
- [ ] Selecione uma sugestão e verifique se os campos são preenchidos

---

## 9. Calendário / Blocos

> Na aba "Planejar", seção Calendário Semanal, clique em "+" para criar bloco.

### 9.1 Bloco de Foco

| Campo | Valor sugerido |
|-------|---------------|
| Título | `Deep Work - Código` |
| Descrição | `Sem interrupções. Celular no silencioso.` |
| Tipo | `focus` (Foco) |
| Data | Hoje |
| Horário | `08:00 - 10:00` |

- [ ] Bloco criado no calendário
- [ ] Cor/ícone de foco aplicado

### 9.2 Bloco de Reunião

| Campo | Valor sugerido |
|-------|---------------|
| Título | `Daily standup` |
| Tipo | `meeting` (Reunião) |
| Data | Hoje |
| Horário | `10:00 - 10:15` |

### 9.3 Bloco Pessoal

| Campo | Valor sugerido |
|-------|---------------|
| Título | `Almoço` |
| Tipo | `personal` (Pessoal) |
| Data | Hoje |
| Horário | `12:00 - 13:00` |

### 9.4 Bloco vinculado a Tarefa
- [ ] Crie um bloco e selecione "Vincular tarefa" → escolha tarefa existente
- [ ] Bloco mostra título da tarefa vinculada

### 9.5 Bloco vinculado a Hábito
- [ ] Crie um bloco e selecione "Vincular hábito" → escolha hábito existente
- [ ] Bloco mostra o hábito vinculado

### 9.6 Navegar semanas
- [ ] Use as setas para ir para semana anterior e próxima
- [ ] Blocos aparecem nos dias corretos

---

## 10. Pomodoro

### 10.1 Criar Preset Personalizado

| Campo | Valor sugerido |
|-------|---------------|
| Nome | `Estudo Intenso` |
| Foco (min) | `50` |
| Pausa (min) | `10` |
| Pausa Longa (min) | `30` |
| Ciclos até pausa longa | `4` |

- [ ] Preset criado na lista de presets

### 10.2 Iniciar Sessão Pomodoro
- [ ] Selecione o preset "Estudo Intenso" (ou o padrão 25/5)
- [ ] Clique em "Iniciar"
- [ ] Timer começa a contar
- [ ] Pausa automática ao fim do ciclo de foco
- [ ] Som/notificação ao fim do ciclo

### 10.3 Pausar e Retomar
- [ ] Clique em "Pausar" durante o timer
- [ ] Timer para
- [ ] Clique em "Retomar"
- [ ] Timer continua de onde parou

### 10.4 Pular para próxima fase
- [ ] Clique em "Pular" para ir para pausa ou próximo ciclo

### 10.5 Cancelar sessão
- [ ] Clique em "Cancelar"
- [ ] Timer reseta

---

## 11. Anotações Diárias

> Na aba "Planejar", seção Notas, clique em "+" para criar.

### 11.1 Criar Nota

| Campo | Valor sugerido |
|-------|---------------|
| Título | `Ideias para o produto` |
| Conteúdo | `- Feature de gamificação\n- Integração com Notion\n- Widget para celular\n- Relatório semanal em PDF` |
| Tags | `trabalho, ideias, pesquisa` |
| URL de origem | `https://example.com/artigo-produtividade` |

- [ ] Nota criada com sucesso
- [ ] Tags exibidas como badges
- [ ] URL clicável

### 11.2 Editar Nota
- [ ] Clique na nota existente
- [ ] Altere o conteúdo adicionando `- Notificações push`
- [ ] Salve e verifique se o conteúdo atualizou

### 11.3 Deletar Nota
- [ ] Delete a nota de teste
- [ ] Nota some da lista

---

## 12. Finanças

> Acesse o módulo "Finanças" pela navegação inferior ou menu de centrais.

### 12.1 Configurar Contas (aba Configurações)

**Conta 1:**

| Campo | Valor sugerido |
|-------|---------------|
| Nome | `Nubank` |
| Tipo | `checking` (Conta Corrente) |
| Saldo Inicial | `5000` |

**Conta 2:**

| Campo | Valor sugerido |
|-------|---------------|
| Nome | `Carteira` |
| Tipo | `cash` (Dinheiro) |
| Saldo Inicial | `200` |

**Conta 3:**

| Campo | Valor sugerido |
|-------|---------------|
| Nome | `Cartão Itaú` |
| Tipo | `credit` (Crédito) |
| Saldo Inicial | `0` |

**Conta 4:**

| Campo | Valor sugerido |
|-------|---------------|
| Nome | `Poupança Inter` |
| Tipo | `savings` (Poupança) |
| Saldo Inicial | `10000` |

- [ ] 4 contas criadas com sucesso

### 12.2 Configurar Categorias (aba Configurações)

| Nome | Tipo |
|------|------|
| `Alimentação` | Despesa |
| `Transporte` | Despesa |
| `Lazer` | Despesa |
| `Moradia` | Despesa |
| `Saúde` | Despesa |
| `Salário` | Receita |
| `Freelance` | Receita |

- [ ] 7 categorias criadas (5 despesa + 2 receita)

### 12.3 Registrar Receita (aba Transações)

| Campo | Valor sugerido |
|-------|---------------|
| Descrição | `Salário março` |
| Valor | `8500` |
| Data | Hoje |
| Conta | `Nubank` |
| Categoria | `Salário` |

- [ ] Receita registrada
- [ ] Saldo da conta Nubank atualiza → R$ 13.500

### 12.4 Registrar Despesas (aba Transações)

**Despesa 1:**

| Campo | Valor sugerido |
|-------|---------------|
| Descrição | `Supermercado Pão de Açúcar` |
| Valor | `350` |
| Data | Hoje |
| Conta | `Nubank` |
| Categoria | `Alimentação` |

**Despesa 2:**

| Campo | Valor sugerido |
|-------|---------------|
| Descrição | `Uber para escritório` |
| Valor | `25` |
| Data | Hoje |
| Conta | `Nubank` |
| Categoria | `Transporte` |

**Despesa 3:**

| Campo | Valor sugerido |
|-------|---------------|
| Descrição | `Almoço restaurante` |
| Valor | `45` |
| Data | Hoje |
| Conta | `Carteira` |
| Categoria | `Alimentação` |

- [ ] 3 despesas registradas
- [ ] Saldos de cada conta atualizados corretamente

### 12.5 Rendas Fixas (aba Receitas/Despesas)

| Campo | Valor sugerido |
|-------|---------------|
| Nome | `Salário CLT` |
| Valor | `8500` |
| Conta | `Nubank` |
| Frequência | `Mensal` |
| Dia do mês | `5` |
| Auto-confirmar | ✅ Ligado |

- [ ] Renda fixa criada
- [ ] Aparece na lista de recorrências

### 12.6 Verificar Overview (aba Visão Geral)
- [ ] Gráficos de receita vs despesa aparecem
- [ ] Resumo de saldos por conta correto
- [ ] Total geral correto (somatório de todas as contas)

### 12.7 Chat financeiro (se disponível)
- [ ] Abra o chat de finanças
- [ ] Digite: `Qual meu saldo total?`
- [ ] Verifique se resposta faz sentido

---

## 13. Leitura

> Acesse o módulo "Leitura" pela navegação.

### 13.1 Adicionar Livro (aba Livros)

**Livro 1:**

| Campo | Valor sugerido |
|-------|---------------|
| Título | `O Poder do Hábito` |
| Autor | `Charles Duhigg` |
| Total de Páginas | `408` |
| Data de Início | Hoje |
| Meta de Conclusão | Daqui 30 dias |
| Notas | `Recomendação do podcast. Foco em rotinas e neurociência.` |

**Livro 2:**

| Campo | Valor sugerido |
|-------|---------------|
| Título | `Clean Code` |
| Autor | `Robert C. Martin` |
| Total de Páginas | `464` |
| Data de Início | Hoje |
| Notas | `Referência clássica de engenharia de software.` |

- [ ] 2 livros adicionados
- [ ] Ambos com status "Lendo"
- [ ] Progresso mostra 0%

### 13.2 Atualizar Progresso

Selecione "O Poder do Hábito" e clique em atualizar progresso:

| Campo | Valor sugerido |
|-------|---------------|
| Página Atual | `85` |

- [ ] Progresso atualiza (85/408 = ~21%)
- [ ] Log de leitura criado automaticamente

### 13.3 Atualizar Progresso novamente

| Campo | Valor sugerido |
|-------|---------------|
| Página Atual | `142` |

- [ ] Progresso muda para ~35%
- [ ] Novo log criado (57 páginas lidas)

### 13.4 Upload de PDF (aba PDFs)
- [ ] Clique em "Carregar PDF"
- [ ] Selecione um arquivo PDF qualquer
- [ ] PDF aparece na lista
- [ ] Clique para abrir no leitor de PDF

### 13.5 Leitor de PDF
- [ ] PDF renderiza corretamente
- [ ] Navegação de páginas funciona
- [ ] Zoom funciona
- [ ] Highlight/marcação funciona (selecione texto e marque)

---

## 14. Estudos

> Acesse o módulo "Estudos" pela navegação.

### 14.1 Criar Assuntos

Clique em "+" para adicionar assunto:

| Assunto # | Valor sugerido |
|-----------|---------------|
| 1 | `JavaScript Avançado` |
| 2 | `Sistemas Distribuídos` |
| 3 | `Inglês B2` |

- [ ] 3 assuntos criados e listados

### 14.2 Iniciar Sessão de Estudo

Clique em "Estudar" ou "Nova sessão":

| Campo | Valor sugerido |
|-------|---------------|
| Assunto | `JavaScript Avançado` (selecionar) |
| Notas rápidas | `Closures, Promises, Event Loop` |
| Duração (min) | `45` |
| Agendar revisão | ✅ Ativado |

- [ ] Timer de sessão inicia
- [ ] Ao finalizar, sessão é registrada

### 14.3 Finalizar Sessão

Ao terminar a sessão (ou adiantar):

| Campo | Valor sugerido |
|-------|---------------|
| Notas finais | `Entendi closures e lexical scope. Rever Promises rejeitadas.` |

- [ ] Sessão salva com duração e notas
- [ ] Revisão espaçada agendada (se ativado)

### 14.4 Auto-Teste (Self Test)
- [ ] Acesse um assunto estudado
- [ ] Inicie o auto-teste
- [ ] Responda perguntas e avalie seu nível de retenção

### 14.5 Verificar Histórico de Sessões
- [ ] Veja lista de sessões concluídas
- [ ] Duração total acumulada por assunto
- [ ] Cronograma de revisões futuras

---

## 15. Bem-estar

> Acesse o módulo "Bem-estar" pela navegação.

### 15.1 Fazer Check-in Diário

| Campo | Valor sugerido |
|-------|---------------|
| Horas de sono | `7` (slider) |
| Nível de energia | `Médio` (medium) |
| Humor | `Alto` (high) |
| Notas | `Dia produtivo, consegui focar bem pela manhã.` |

- [ ] Check-in salvo
- [ ] Aparece no histórico

### 15.2 Segundo Check-in (editar)
- [ ] Edite o check-in de hoje
- [ ] Mude horas de sono para `8`
- [ ] Mude energia para `Alto`
- [ ] Salve e verifique se atualizou

### 15.3 Criar Programa de Bem-estar

| Campo | Valor sugerido |
|-------|---------------|
| Tipo | `sleep` (Sono) |
| Duração | `7 dias` |

- [ ] Programa criado
- [ ] Ações diárias aparecem para serem concluídas

### 15.4 Criar segundo programa

| Campo | Valor sugerido |
|-------|---------------|
| Tipo | `focus` (Foco) |
| Duração | `14 dias` |

- [ ] Programa criado com 14 dias de ações

### 15.5 Completar ação do programa
- [ ] Marque uma ação do dia como concluída
- [ ] Progresso do programa atualiza

### 15.6 Verificar Insights
- [ ] Clique em "Ver Insights" (se disponível)
- [ ] Gráficos/tendências de sono, energia e humor aparecem

---

## 16. Treino

> Acesse o módulo "Treino" pela navegação.

### 16.1 Criar Ficha de Treino (aba Fichas)

**Ficha 1:**

| Campo | Valor sugerido |
|-------|---------------|
| Nome da Ficha | `Treino A - Peito e Tríceps` |
| Dias | Marque: **Seg**, **Qua** |
| Observações | `Começar com aquecimento 5min esteira` |

**Ficha 2:**

| Campo | Valor sugerido |
|-------|---------------|
| Nome da Ficha | `Treino B - Costas e Bíceps` |
| Dias | Marque: **Ter**, **Qui** |
| Observações | `Foco em pegada pronada nos puxadores` |

- [ ] 2 fichas criadas

### 16.2 Adicionar Exercícios à Ficha A

Abra "Treino A - Peito e Tríceps" e adicione exercícios:

**Exercício 1:**

| Campo | Valor sugerido |
|-------|---------------|
| Nome do Exercício | `Supino Reto` |
| Grupo Muscular | `Peito` (chest) |

**Exercício 2:**

| Campo | Valor sugerido |
|-------|---------------|
| Nome do Exercício | `Crucifixo Inclinado` |
| Grupo Muscular | `Peito` (chest) |

**Exercício 3:**

| Campo | Valor sugerido |
|-------|---------------|
| Nome do Exercício | `Tríceps Pulley` |
| Grupo Muscular | `Tríceps` (triceps) |

**Exercício 4:**

| Campo | Valor sugerido |
|-------|---------------|
| Nome do Exercício | `Tríceps Testa` |
| Grupo Muscular | `Tríceps` (triceps) |

- [ ] 4 exercícios adicionados à ficha

### 16.3 Configurar Prescrição (séries x repetições)

Clique em um exercício para configurar a prescrição:

**Supino Reto:**
- [ ] Use o preset rápido `4×8–12`
- [ ] Ou configure manualmente:
  - Séries: `4`
  - Reps mín: `8`
  - Reps máx: `12`

**Tríceps Pulley:**
- [ ] Use o preset rápido `3×12`

### 16.4 Configurar Técnica Avançada (opcional)

Para "Supino Reto", adicione técnica:
- [ ] Selecione `Backoff Set` → Percentual: `25%`
- [ ] Ou selecione `Rest-Pause` → Pause: `15s`, Mini-sets: `3`

### 16.5 Iniciar Treino (aba Treinar)

- [ ] Selecione "Treino A - Peito e Tríceps"
- [ ] Clique em "Iniciar Treino"
- [ ] Timer de treino começa

### 16.6 Registrar Séries

Para cada exercício, registre as séries:

**Supino Reto - Série 1:**

| Campo | Valor sugerido |
|-------|---------------|
| Repetições | `12` |
| Carga (kg) | `60` |
| Aquecimento | ❌ Não |

**Supino Reto - Série 2:**

| Campo | Valor sugerido |
|-------|---------------|
| Repetições | `10` |
| Carga (kg) | `70` |
| Aquecimento | ❌ |

**Supino Reto - Série 3:**

| Campo | Valor sugerido |
|-------|---------------|
| Repetições | `8` |
| Carga (kg) | `80` |
| Aquecimento | ❌ |

- [ ] 3 séries registradas para o exercício
- [ ] Carga e reps exibidos na lista

### 16.7 Finalizar Treino
- [ ] Clique em "Finalizar Treino"
- [ ] Sessão salva com duração total
- [ ] Aparece no histórico (aba Progresso)

### 16.8 Verificar Progresso (aba Progresso)
- [ ] Gráficos de volume e carga por grupo muscular
- [ ] Histórico de treinos anteriores
- [ ] Evolução de carga por exercício

---

## 17. Dieta

> Acesse o módulo "Dieta" pela navegação.

### 17.1 Criar Templates de Refeição (aba Plano)

**Template 1:**

| Campo | Valor sugerido |
|-------|---------------|
| Nome | `Café da manhã` |
| Horário padrão | `07:00` |
| Frequência | `Todos os dias` |
| Alimentos | (adicione via sugestões rápidas ou manualmente) |

Alimentos para adicionar:
- `Ovos mexidos` — Qtd: `3` — Un: `unidades`
- `Pão integral` — Qtd: `2` — Un: `fatias`
- `Café com leite` — Qtd: `1` — Un: `xícara`

**Template 2:**

| Campo | Valor sugerido |
|-------|---------------|
| Nome | `Almoço` |
| Horário padrão | `12:30` |
| Frequência | `Dias úteis` |

Alimentos:
- `Arroz integral` — Qtd: `150` — Un: `g`
- `Frango grelhado` — Qtd: `200` — Un: `g`
- `Salada verde` — Qtd: `1` — Un: `porção`
- `Feijão` — Qtd: `100` — Un: `g`

**Template 3:**

| Campo | Valor sugerido |
|-------|---------------|
| Nome | `Lanche da tarde` |
| Horário padrão | `16:00` |
| Frequência | `Manual` |

Alimentos:
- `Whey Protein` — Qtd: `30` — Un: `g`
- `Banana` — Qtd: `1` — Un: `unidade`

- [ ] 3 templates criados

### 17.2 Registrar Refeição do Dia (aba Hoje)

Se os templates auto-geram refeições:
- [ ] Verifique se as refeições do dia aparecem automaticamente
- [ ] Marque refeições como consumidas

Se manual, registre uma refeição:

| Campo | Valor sugerido |
|-------|---------------|
| Nome da refeição | `Jantar` |
| Horário | `20:00` |
| Alimentos | `Salmão grelhado` — 200g, `Batata doce` — 150g, `Brócolis` — 100g |
| Notas | `Refeição pós-treino. Mais proteína.` |

- [ ] Refeição registrada e visível na timeline do dia

### 17.3 Verificar Histórico (aba Histórico)
- [ ] Dias anteriores com refeições registradas aparecem
- [ ] Pode navegar entre datas

---

## 18. Configurações e Perfil

### 18.1 Perfil

> Clique no avatar ou nome no topo → "Perfil"

- [ ] Avatar exibido (ou fallback com iniciais)
- [ ] Clique no avatar para upload de imagem → selecione um JPG/PNG
- [ ] Avatar atualiza após upload
- [ ] Botão de deletar avatar funciona

### 18.2 Configurações Gerais

> Clique no ícone de engrenagem → "Configurações"

| Campo | Ação |
|-------|------|
| Modo escuro | Toggle ON/OFF → tema muda imediatamente |
| Início da semana | Selecione `Domingo` ou `Segunda` |

- [ ] Modo escuro liga/desliga corretamente
- [ ] Início da semana muda o calendário

### 18.3 Módulos

> Clique em "Módulos" para ativar/desativar

- [ ] Desative "Dieta" → módulo some da navegação
- [ ] Reative "Dieta" → módulo reaparece
- [ ] Teste com cada módulo: Finanças, Leitura, Estudos, Bem-estar, Treino, Dieta

### 18.4 Privacidade
- [ ] Acesse tela de privacidade
- [ ] Informações de privacidade exibidas corretamente

---

## 19. Exportação de Dados

> Acesse "Exportar dados" (geralmente via Configurações ou menu do perfil)

### 19.1 Exportar Tarefas

| Campo | Ação |
|-------|------|
| Tarefas e projetos | ✅ Marcado |
| Hábitos e registros | ❌ Desmarcado |
| Metas e Key Results | ❌ Desmarcado |

- [ ] Clique em "Exportar"
- [ ] Arquivo `.md` gerado e baixado
- [ ] Conteúdo inclui as tarefas criadas anteriormente

### 19.2 Exportar Tudo

| Campo | Ação |
|-------|------|
| Tarefas e projetos | ✅ Marcado |
| Hábitos e registros | ✅ Marcado |
| Metas e Key Results | ✅ Marcado |

- [ ] Arquivo exportado com todos os dados
- [ ] Conteúdo contém seções # Tarefas, # Hábitos, # Metas

---

## 20. Evolução (Dashboard)

> Acesse a aba "Evolução" na navegação inferior.

### 20.1 Score Geral
- [ ] Score de 0-100 exibido
- [ ] Score reflete as atividades feitas nos outros módulos
- [ ] Badge de nível visível (Iniciante, Regular, Consistente, etc.)

### 20.2 Gráficos e Métricas
- [ ] Gráfico de tendência de score (últimos 7/30 dias)
- [ ] Breakdown por módulo (Tarefas, Hábitos, Metas, etc.)
- [ ] Horas de foco acumuladas
- [ ] Taxa de conclusão de tarefas
- [ ] Streak de hábitos

### 20.3 Insights
- [ ] Cards com insights personalizados
- [ ] Sugestões de melhoria baseadas nos dados

### 20.4 Comparativo Temporal
- [ ] Compare esta semana vs semana passada
- [ ] Setas de tendência (↑ melhorou, ↓ piorou)

---

## 21. Landing Page e Checkout

### 21.1 Landing Page

- [ ] Acesse `/` (raiz) sem login
- [ ] Hero section com título e CTAs funcionais
- [ ] Seção de funcionalidades visível
- [ ] Preços exibidos (Leve, Pro, Lifetime)
- [ ] FAQ interativo (accordion) funciona
- [ ] Depoimentos visíveis
- [ ] Menu hamburger funciona em mobile
- [ ] Links de navegação rolam para as seções corretas
- [ ] CTA "Começar Gratuitamente" redireciona para registro

### 21.2 Checkout / Pagamento

- [ ] Clique em "Assinar" em um plano
- [ ] Modal de checkout abre
- [ ] Integração com Mercado Pago funciona
- [ ] Toggle mensal/anual muda os preços
- [ ] Plano Lifetime mostra preço único

---

## 22. PWA e Responsividade

### 22.1 Instalação PWA
- [ ] No Chrome, ícone de instalar aparece na barra de endereço
- [ ] Clique em instalar → app abre como standalone
- [ ] Ícone aparece na área de trabalho/dock

### 22.2 Responsividade Mobile (DevTools F12)
- [ ] Teste em 375x667 (iPhone SE)
- [ ] Teste em 390x844 (iPhone 14)
- [ ] Teste em 768x1024 (iPad)
- [ ] Bottom nav visível e funcional em mobile
- [ ] Dialogs não cortam em telas pequenas
- [ ] Tabelas/cards ajustam largura

### 22.3 Offline (Service Worker)
- [ ] Desconecte a internet
- [ ] App ainda carrega (cache PWA)
- [ ] Reconecte e verifique se dados sincronizam

---

## 📋 Checklist Final de Sanidade

| Verificação | Status |
|-------------|--------|
| Login/Logout funciona | ☐ |
| Dados persistem entre sessões | ☐ |
| Modo escuro funciona em todas as telas | ☐ |
| Nenhum erro no console (F12) | ☐ |
| Toast de sucesso/erro aparece nas ações | ☐ |
| Todos os dialogs abrem e fecham corretamente | ☐ |
| Deletar mostra confirmação antes | ☐ |
| Calendário semanal mostra dados corretos | ☐ |
| Dados do Quick Capture → Processar → Tarefa fluem corretamente | ☐ |
| Score na Evolução reflete ações realizadas | ☐ |
| Export gera arquivo com dados reais | ☐ |
| Nenhuma tela em branco ou loading infinito | ☐ |
| Navegação entre abas é fluida | ☐ |
| Responsive: mobile/tablet/desktop | ☐ |
| PWA instalável | ☐ |

---

## 🐛 Log de Bugs Encontrados

| # | Tela/Módulo | Descrição do Bug | Severidade | Reprodução |
|---|------------|-------------------|-----------|------------|
| 1 | | | ☐ Crítico ☐ Alto ☐ Médio ☐ Baixo | |
| 2 | | | ☐ Crítico ☐ Alto ☐ Médio ☐ Baixo | |
| 3 | | | ☐ Crítico ☐ Alto ☐ Médio ☐ Baixo | |
| 4 | | | ☐ Crítico ☐ Alto ☐ Médio ☐ Baixo | |
| 5 | | | ☐ Crítico ☐ Alto ☐ Médio ☐ Baixo | |

> Preencha à medida que encontrar problemas durante os testes.
