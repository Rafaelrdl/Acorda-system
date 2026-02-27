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
7. [Objetivos e Key Results](#7-objetivos-e-key-results)
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
- [x] Tela informativa exibida
- [x] Botão "Avançar" funciona

### Etapa 2: Goal (Objetivo inicial)
- [x] Permite definir um objetivo inicial
- **Sugestão:** Selecione qualquer opção pré-definida

### Etapa 3: Habits (Hábitos)
- [x] Permite selecionar hábitos sugeridos
- **Sugestão:** Marque 3 hábitos (ex: Meditar, Exercitar, Ler)

### Etapa 4: Tour (Guia visual)
- [x] Exibe tour guiado pelas funcionalidades
- [x] Botão "Avançar" funciona

### Etapa 5: Modules (Módulos)
- [x] Permite ativar/desativar módulos (Finanças, Leitura, Estudos, Bem-estar, Treino, Dieta)
- **Sugestão:** Ative todos os 6 módulos

### Etapa 6: Ready (Pronto)
- [x] Exibe mensagem de conclusão
- [x] Botão "Começar" redireciona para o app principal
- [x] Onboarding não aparece em logins futuros

**Validação extra:**
- [x] Indicador de progresso (dots/steps) reflete o passo atual
- [x] Botão "Voltar" funciona em todos os passos

---

## 3. Quick Capture (Inbox)

> Clique no FAB (botão flutuante "+") para abrir a Captura Rápida. Os itens capturados aparecem na sub-aba **Inbox** dentro de **Planejar**.

### 3.1 Captura rápida simples

| Campo | Valor sugerido |
|-------|---------------|
| Input principal | `Comprar presente de aniversário da Maria` |

- [x] Enter envia para Inbox
- [x] Item aparece na lista do Inbox
- [x] Campo limpa após envio

### 3.2 Captura com detalhes (expandir)

| Campo | Valor sugerido |
|-------|---------------|
| Input principal | `Pesquisar cursos de React avançado` |
| Detalhes | `Ver Udemy, Frontendmasters e Egghead. Comparar preços e conteúdo.` |

- [x] Detalhes salvos com o item
- [x] Item aparece no Inbox com os detalhes

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

- [x] Todos os 7 itens aparecem no Inbox

---

## 4. Processar Inbox (GTD)

> Na aba **Planejar → Inbox**, clique no botão ▶ ao lado de um item para processar individualmente, ou clique em **"Processar todos"** para modo batch.
> O fluxo segue 4 passos: **Acionável?** → **Próxima Ação** → **Destino** → **Detalhes**

### 4.1 Item NÃO acionável → Anotação

**Item:** `Ler artigo sobre produtividade`

1. Clique no botão ▶ do item
2. "Isso é acionável?" → Escolha **"Não, apenas anotação"**
3. Preencha os campos que aparecem:

| Campo | Valor sugerido |
|-------|---------------|
| Título | `Artigo sobre produtividade` |
| Tags | `leitura, referência` |

4. Clique em **"Salvar como anotação"**

- [x] Item removido do Inbox
- [x] Aparece na sub-aba **Notas** (dentro de Planejar)


### 4.2 Item acionável → Fazer agora (Regra dos 2 minutos)

**Item:** `Comprar café e leite`

1. Clique no botão ▶ do item
2. "Isso é acionável?" → Escolha **"Sim, preciso fazer algo"**
3. **Passo "Próxima Ação"** — preencha:

| Campo | Valor sugerido |
|-------|---------------|
| Título da tarefa | `Comprar café e leite` (já pré-preenchido) |
| Qual a próxima ação física? | `Ir ao mercado da esquina e comprar` |
| Tags | `pessoal` |

4. Clique em **"Continuar →"**
5. **Passo "Destino"** — "O que fazer com esta tarefa?" → Escolha **"Fazer agora (<2 min) e concluir"**
6. Mensagem verde aparece: *"Se leva menos de 2 minutos, faça agora mesmo!"*
7. Clique em **"Concluir"**

- [x] Tarefa criada e marcada como concluída automaticamente
- [x] Item removido do Inbox
- [x] Tarefa aparece em "Concluídas Recentemente" na sub-aba Tarefas

### 4.3 Item acionável → Próxima Ação

**Item:** `Ligar para dentista marcar consulta`

1. Clique no botão ▶ do item
2. "Isso é acionável?" → Escolha **"Sim, preciso fazer algo"**
3. **Passo "Próxima Ação"** — preencha:

| Campo | Valor sugerido |
|-------|---------------|
| Título da tarefa | `Ligar para dentista marcar consulta` (já pré-preenchido) |
| Qual a próxima ação física? | `Ligar para (11) 99999-0000 e agendar limpeza` |
| Tags | `saúde, telefone` |

4. Clique em **"Continuar →"**
5. **Passo "Destino"** — Escolha **"Próxima ação (fazer em breve)"**
6. Clique em **"Continuar →"**
7. **Passo "Detalhes"** (opcional) — preencha ou pule:

| Campo | Valor sugerido |
|-------|---------------|
| Energia | `Baixa` (low) |
| Estimativa (min) | `5` |

8. Clique em **"Criar tarefa"**

- [x] Item vira tarefa com status `next`
- [x] Aparece em **Planejar → Tarefas → Próximas Ações**

### 4.4 Item acionável → Agendado

**Item:** `Revisar relatório mensal`

1. Clique no botão ▶ do item
2. "Isso é acionável?" → **"Sim, preciso fazer algo"**
3. **Passo "Próxima Ação"** — preencha:

| Campo | Valor sugerido |
|-------|---------------|
| Título da tarefa | `Revisar relatório mensal` |
| Qual a próxima ação física? | `Abrir planilha de métricas e revisar números de fevereiro` |
| Tags | `trabalho` |

4. Clique em **"Continuar →"**
5. **Passo "Destino"** — Escolha **"Agendar para uma data"**
6. Preencha os campos de agendamento que aparecem:

| Campo | Valor sugerido |
|-------|---------------|
| Data | Próxima segunda-feira (selecione no calendário) |
| Horário início | `09:00` |
| Duração | `1h 00min` |

7. Clique em **"Continuar →"**
8. **Passo "Detalhes"** — preencha:

| Campo | Valor sugerido |
|-------|---------------|
| Energia | `Alta` (high) |
| Estimativa (min) | `60` |

9. Clique em **"Criar tarefa"**

- [x] Item vira tarefa com status `scheduled`
- [x] Aparece em **Planejar → Tarefas → Agendadas**
- [x] Aparece como bloco no calendário na sub-aba **Semana**

### 4.5 Item acionável → Algum dia/Talvez

**Item:** `Organizar fotos do celular`

1. Clique no botão ▶ do item
2. "Isso é acionável?" → **"Sim, preciso fazer algo"**
3. **Passo "Próxima Ação"** — preencha:

| Campo | Valor sugerido |
|-------|---------------|
| Título da tarefa | `Organizar fotos do celular` |
| Qual a próxima ação física? | `Separar fotos por pastas no Google Fotos` |

4. Clique em **"Continuar →"**
5. **Passo "Destino"** — Escolha **"Algum dia / talvez"**
6. Clique em **"Continuar →"** → preencha detalhes ou pule
7. Clique em **"Criar tarefa"**

- [x] Item vira tarefa com status `someday`
- [x] Aparece em **Planejar → Tarefas → Algum Dia / Talvez**

### 4.6 Item acionável → Aguardando

**Item:** `Enviar e-mail para fornecedor`

1. Clique no botão ▶ do item
2. "Isso é acionável?" → **"Sim, preciso fazer algo"**
3. **Passo "Próxima Ação"** — preencha:

| Campo | Valor sugerido |
|-------|---------------|
| Título da tarefa | `Enviar e-mail para fornecedor` |
| Qual a próxima ação física? | `Enviar proposta com valores atualizados para João` |

4. Clique em **"Continuar →"**
5. **Passo "Destino"** — Escolha **"Aguardando alguém (delegada)"**
6. Clique em **"Continuar →"** → preencha detalhes ou pule
7. Clique em **"Criar tarefa"**

- [x] Item vira tarefa com status `waiting`
- [x] Aparece em **Planejar → Tarefas → Aguardando**

### 4.7 Criar tarefa com detalhes completos

**Item:** `Comprar presente de aniversário da Maria`

1. Clique no botão ▶ do item
2. "Isso é acionável?" → **"Sim, preciso fazer algo"**
3. **Passo "Próxima Ação"**:

| Campo | Valor sugerido |
|-------|---------------|
| Título da tarefa | `Comprar presente de aniversário da Maria` |
| Qual a próxima ação física? | `Pesquisar no Mercado Livre opções de presente` |
| Tags | `pessoal, urgente` |

4. Clique em **"Continuar →"**
5. **Passo "Destino"** — Escolha **"Próxima ação (fazer em breve)"**
6. Clique em **"Continuar →"**
7. **Passo "Detalhes"** — preencha todos os campos:

| Campo | Valor sugerido |
|-------|---------------|
| Energia | `Média` (medium) |
| Estimativa (min) | `30` |
| Projeto | (selecione um se existir) |
| Vincular ao Objetivo | (selecione um se existir) |

8. Clique em **"Criar tarefa"**

- [x] Tarefa criada com todos os campos preenchidos
- [x] Aparece em **Planejar → Tarefas → Próximas Ações**

### 4.8 Processar todos em batch

> Se restam itens no Inbox, use o modo batch.

1. Com mais de 1 item no Inbox, clique em **"Processar todos"**
2. O dialog mostra indicador *"(X de Y)"* no cabeçalho
3. Processe cada item escolhendo destinos variados
4. Ao concluir um item, o próximo abre automaticamente

- [x] Todos os itens do Inbox foram processados
- [x] Badge de contagem do Inbox zerou
- [x] Dialog fecha automaticamente ao finalizar o último item

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

> Na aba **Planejar → Projetos**, clique em **"Projeto"** (botão no canto superior direito) para criar um novo projeto. A aba Projetos mostra todos os projetos ativos com barra de progresso, tarefas vinculadas e seção de projetos concluídos/arquivados.

### 6.1 Acessar aba Projetos
1. Vá para **Planejar** na navegação inferior
2. Clique na sub-aba **"Projetos"** (ícone de pasta)

- [x] Sub-aba Projetos aparece na barra de sub-abas
- [x] Estado vazio exibe: ícone de pasta + "Nenhum projeto ativo" + "Crie um projeto para organizar suas tarefas"

### 6.2 Criar Primeiro Projeto

1. Clique no botão **"Projeto"** (com ícone "+") no topo direito
2. Dialog "Novo Projeto" abre com os campos:

| Campo | Valor sugerido |
|-------|---------------|
| Nome | `Lançamento App Mobile` |
| Descrição | `MVP do aplicativo mobile com React Native` |
| Status | `Ativo` (padrão) |
| Prazo | Daqui 30 dias (selecione no campo de data) |
| Tags | `trabalho, tech` |

3. Clique em **"Criar Projeto"**

- [x] Projeto criado com sucesso
- [x] Aparece como card na lista de projetos ativos
- [x] Nome, descrição e prazo exibidos no card
- [x] Tags aparecem como badges
- [x] Barra de progresso mostra **0/0** (sem tarefas vinculadas)

### 6.3 Criar Segundo Projeto

1. Clique novamente em **"Projeto"**
2. Preencha:

| Campo | Valor sugerido |
|-------|---------------|
| Nome | `Reforma do escritório` |
| Descrição | `Pintura, móveis novos e organização` |
| Status | `Ativo` |
| Tags | `pessoal, casa` |

3. Clique em **"Criar Projeto"**

- [x] Segundo projeto aparece na lista
- [x] Ambos os projetos visíveis com seus respectivos dados

### 6.4 Vincular Tarefa a Projeto

> Para que o campo "Projeto" apareça no processamento do Inbox (passo 4 — Detalhes), é necessário ter pelo menos 1 projeto ativo.

1. Vá para **Planejar → Tarefas**
2. Clique no lápis (✏️) da tarefa "Preparar apresentação..." (ou qualquer tarefa existente)
3. No dialog de edição, selecione o **Projeto** → `Lançamento App Mobile`
4. Salve

- [x] Tarefa vinculada ao projeto
- [x] Ao voltar na aba **Projetos**, o card "Lançamento App Mobile" agora mostra **0/1** na barra de progresso

### 6.5 Vincular mais tarefas ao projeto

Repita o passo 6.4 para vincular pelo menos **2 tarefas** ao projeto "Lançamento App Mobile" (ex: "Reunião com equipe de marketing" e outra tarefa existente).

- [x] Barra de progresso atualiza (ex: **0/3**)

### 6.6 Expandir projeto para ver tarefas

1. Na aba **Projetos**, clique no card do projeto **"Lançamento App Mobile"**
2. O card expande mostrando as tarefas vinculadas

- [x] Seta ► muda para ▼ ao expandir
- [x] Tarefas pendentes listadas com ícone de checkbox
- [x] Tarefas com prioridade mostram estrela ★ amarela
- [x] Cada tarefa tem botão de editar (lápis)
- [x] Clicar novamente no card recolhe a lista

### 6.7 Verificar progresso com tarefas concluídas

1. Vá para **Planejar → Tarefas**
2. Marque o checkbox de uma tarefa vinculada ao projeto "Lançamento App Mobile"
3. Volte para **Planejar → Projetos**

- [x] Barra de progresso atualiza (ex: **1/3** = ~33%)
- [x] Ao expandir o projeto, a tarefa concluída aparece na seção "X concluída(s)" com ícone ✓ e texto riscado

### 6.8 Editar Projeto

1. Clique no ícone de lápis (✏️) do projeto "Reforma do escritório"
2. Dialog "Editar Projeto" abre com os dados preenchidos
3. Altere:

| Campo | Novo valor |
|-------|-----------|
| Nome | `Reforma do escritório - Fase 1` |
| Descrição | `Pintura e troca de móveis da sala principal` |

4. Clique em **"Salvar"**

- [x] Nome e descrição atualizados no card

### 6.9 Concluir Projeto

1. Clique no ícone de lápis (✏️) do projeto "Reforma do escritório - Fase 1"
2. Altere o **Status** para **"Concluído"**
3. Salve

- [x] Projeto some da lista de "Projetos Ativos"
- [x] Seção **"Concluídos / Arquivados (1)"** aparece na parte inferior
- [x] Clique na seta para expandir a seção
- [x] Projeto aparece com badge "Concluído"

### 6.10 Arquivar Projeto

1. Clique no lápis (✏️) do projeto "Lançamento App Mobile"
2. Altere o **Status** para **"Arquivado"**
3. Salve

- [x] Projeto some da lista de ativos
- [x] Contador da seção "Concluídos / Arquivados" atualiza para **(2)**
- [x] Projeto aparece com badge "Arquivado"

### 6.11 Reativar Projeto

1. Na seção "Concluídos / Arquivados", clique no lápis (✏️) do projeto "Lançamento App Mobile"
2. Altere o **Status** de volta para **"Ativo"**
3. Salve

- [x] Projeto volta para a lista de projetos ativos
- [x] Contador da seção "Concluídos / Arquivados" diminui

### 6.12 Excluir Projeto

1. Clique no ícone de lixeira (🗑) de um projeto
2. Dialog de confirmação aparece: *"Excluir projeto?"*
3. Mensagem informa: *"As tarefas vinculadas não serão excluídas, apenas desvinculadas."*
4. Clique em **"Excluir"**

- [x] Projeto removido da lista
- [x] Tarefas que estavam vinculadas continuam existindo (verifique em **Planejar → Tarefas**)

### 6.13 Projeto no processamento do Inbox

> Este teste valida que o campo "Projeto" aparece no passo 4 (Detalhes) ao processar itens do Inbox.

1. Certifique-se de ter pelo menos 1 projeto ativo
2. Crie um item no Inbox via Captura Rápida: `Criar wireframes do app`
3. Processe o item: Acionável → Sim → Próxima Ação → Próxima ação → **Detalhes**
4. No passo "Detalhes", verifique o campo **Projeto**
5. Selecione o projeto ativo

- [x] Campo "Projeto" aparece no passo Detalhes
- [x] Lista mostra apenas projetos ativos
- [x] Tarefa criada fica vinculada ao projeto selecionado
- [x] Ao visualizar o projeto na aba Projetos, a nova tarefa aparece na lista expandida

---

## 7. Objetivos e Key Results

> Na aba "Planejar", seção Objetivos, clique em "Objetivo" para criar.

### 7.1 Criar Objetivo com KRs tipo Checkpoint

| Campo | Valor sugerido |
|-------|---------------|
| Objetivo | `Ler 12 livros este ano` |
| Descrição | `1 livro por mês, alternando entre ficção e não-ficção` |
| Prazo | Final do ano |

**Key Results (adicione 2 como "Checkpoints"):**

| KR # | Tipo | Valor sugerido |
|-------|------|---------------|
| KR 1 | Checkpoints | `Fazer anotações de cada livro` |
| KR 2 | Checkpoints | `Criar resumo do livro` |

**Checkpoints para KR 1:**
- `Anotações livro Janeiro`
- `Anotações livro Fevereiro`

- [x] Objetivo criado com 2 KRs
- [x] KRs exibem "X / Y checkpoints"
- [x] Barra de progresso mostra 0%
- [x] Marcar um checkpoint atualiza o progresso

### 7.2 Criar Objetivo com KRs tipo Hábito

| Campo | Valor sugerido |
|-------|---------------|
| Objetivo | `Melhorar condicionamento físico` |
| Descrição | `Foco em saúde cardiovascular e força muscular para o próximo trimestre` |
| Prazo | Daqui 90 dias |

**Key Results (adicione 3 como "Hábito"):**

| KR # | Tipo | Descrição | Frequência | Vezes/semana | Dias |
|-------|------|-----------|-----------|-------------|------|
| KR 1 | Hábito | `Correr 3x por semana` | Semanal | 3 | Seg, Qua, Sex |
| KR 2 | Hábito | `Treinar musculação 4x por semana` | Semanal | 4 | Seg, Ter, Qui, Sex |
| KR 3 | Hábito | `Dormir pelo menos 7h por noite` | Diário | - | - |

- [x] Objetivo criado com 3 KRs tipo Hábito
- [x] 3 hábitos foram criados automaticamente na aba Hábitos
- [x] KRs exibem "X% consistência" em vez de checkpoints
- [x] Progresso é calculado com base nos logs de hábito

### 7.3 Criar Objetivo Misto (Checkpoint + Hábito)

| Campo | Valor sugerido |
|-------|---------------|
| Objetivo | `Dominar programação funcional` |
| Prazo | Daqui 6 meses |

| KR # | Tipo | Descrição |
|-------|------|-----------|
| KR 1 | Checkpoints | `Completar curso online` (checkpoints: Módulo 1, Módulo 2, Módulo 3) |
| KR 2 | Hábito | `Praticar 30min por dia` (Diário) |

- [x] Objetivo criado com 1 KR checkpoint + 1 KR hábito
- [x] KR 1 mostra "0 / 3 checkpoints"
- [x] KR 2 mostra "0% consistência" e hábito foi criado

### 7.4 Editar Objetivo
- [x] Clique no ícone de lápis de um objetivo existente
- [x] Dialog "Editar Objetivo" abre com KRs pré-carregados
- [x] Badge mostra tipo de cada KR (Checkpoints ou Hábito)
- [x] Altere o tipo de um KR de Checkpoint → Hábito
- [x] Adicione configuração de hábito (frequência, dias)
- [x] Salve e verifique que novo hábito foi criado
- [x] Verifique que checkpoints antigos foram removidos

### 7.5 Excluir Objetivo
- [x] Clique no ícone de lixeira
- [x] Dialog de confirmação pergunta "Excluir objetivo?"
- [x] Confirme a exclusão
- [x] Objetivo e KRs são removidos da lista

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

- [x] Hábito criado
- [x] Aparece no tracker diário

### 8.2 Criar Hábito Semanal

| Campo | Valor sugerido |
|-------|---------------|
| Nome | `Correr no parque` |
| Descrição | `Corrida leve de 5km` |
| Versão Mínima | `2km caminhando` |
| Frequência | `Semanal` |
| Dias | Marque: **Seg**, **Qua**, **Sex** |

- [x] Hábito criado com dias específicos
- [x] Aparece apenas nos dias selecionados

### 8.3 Mais Hábitos (copie rapidamente)

| Nome | Versão Mínima | Frequência |
|------|--------------|-----------|
| `Ler 30min` | `5 páginas` | Diária |
| `Beber 2L de água` | `1 copo` | Diária |
| `Estudar inglês` | `10 minutos no Duolingo` | Diária |

### 8.4 Marcar Hábito como feito
- [x] Na aba "Hoje", clique no hábito "Meditar" para marcar como feito
- [x] Check visual aparece
- [x] Streak incrementa

### 8.5 Desmarcar Hábito
- [x] Clique novamente para desmarcar
- [x] Check some, streak ajusta

### 8.6 Verificar Sugestões de Hábitos
- [x] No dialog de criar hábito, verifique se botão de sugestões existe
- [x] Clique e veja categorias de hábitos sugeridos
- [x] Selecione uma sugestão e verifique se os campos são preenchidos

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

- [x] Bloco criado no calendário
- [x] Cor/ícone de foco aplicado

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
- [x] Crie um bloco e selecione "Vincular tarefa" → escolha tarefa existente
- [x] Bloco mostra título da tarefa vinculada

### 9.5 Bloco vinculado a Hábito
- [x] Crie um bloco e selecione "Vincular hábito" → escolha hábito existente
- [x] Bloco mostra o hábito vinculado

### 9.6 Navegar semanas
- [x] Use as setas para ir para semana anterior e próxima
- [x] Blocos aparecem nos dias corretos

---

## 10. Pomodoro

> Abra o **Modo Foco** clicando no ícone de timer/play na barra superior. O modal abre com os presets pré-configurados (25/5 Clássico, 50/10 Profundo, 15/3 Rápido). Presets personalizados podem ser criados diretamente dentro do modal.

### 10.1 Verificar Presets Padrão

1. Abra o modal **Modo Foco**
2. Clique no seletor de **Preset**

- [x] 3 presets padrão disponíveis: `25/5 (Clássico)`, `50/10 (Profundo)`, `15/3 (Rápido)`
- [x] Ao trocar de preset, o timer atualiza automaticamente

### 10.2 Criar Preset Personalizado

1. No modal **Modo Foco**, clique no botão **"+"** ao lado do seletor de Preset
2. Formulário inline abre com os campos:

| Campo | Valor sugerido |
|-------|---------------|
| Nome | `Estudo Intenso` |
| Foco (min) | `50` |
| Pausa (min) | `10` |
| Pausa Longa (min) | `30` |
| Ciclos até pausa longa | `4` |

3. Clique em **"Criar Preset"**

- [x] Preset criado e selecionado automaticamente
- [x] Preset aparece no seletor junto aos padrões
- [x] Timer ajusta para 50:00

### 10.3 Editar Preset Personalizado

1. Selecione o preset `Estudo Intenso` no seletor
2. Clique no ícone de **lápis** (✏️) que aparece ao lado (só para presets customizados)
3. Altere o nome para `Estudo Intenso Pro` e o Foco para `55`
4. Clique em **"Salvar"**

- [x] Preset atualizado no seletor
- [x] Timer ajusta para 55:00
- [x] Ícones de editar/excluir NÃO aparecem para os presets padrão

### 10.4 Excluir Preset Personalizado

1. Selecione o preset customizado
2. Clique no ícone de **lixeira** (🗑)
3. Confirme a exclusão

- [x] Preset removido do seletor
- [x] Seletor volta para o primeiro preset padrão

### 10.5 Iniciar Sessão Pomodoro
- [x] Selecione um preset (ou crie um personalizado)
- [x] Clique em **"Iniciar"**
- [x] Timer começa a contar regressivamente
- [x] Indicador visual de progresso (anel circular) preenche conforme o tempo passa
- [x] Pausa automática ao fim do ciclo de foco
- [x] Toast "Sessão de foco concluída! 🎉" aparece

### 10.6 Pausar e Retomar
- [x] Clique em **"Pausar"** durante o timer → timer para
- [x] Clique em **"Retomar"** → timer continua de onde parou

### 10.7 Pular para próxima fase
- [x] Durante a pausa, clique em **"Pular"** para ir direto ao próximo ciclo de foco

### 10.8 Cancelar sessão
- [x] Clique no **"X"** durante uma sessão ativa
- [x] Timer reseta e sessão é salva como abortada

### 10.9 Vincular tarefa ao foco

1. Crie uma tarefa com status "Próxima Ação" (se não existir)
2. Abra o Modo Foco
3. No campo **"Tarefa (opcional)"**, selecione a tarefa

- [x] Campo "Tarefa" mostra tarefas ativas (next/scheduled)
- [x] Inicie a sessão com tarefa vinculada

### 10.10 Registrar Interrupção
- [x] Durante uma sessão ativa, clique em **"Registrar Interrupção"**
- [x] Toast "Interrupção registrada na Inbox" aparece
- [x] Contador de interrupções incrementa no timer
- [x] Item aparece no Inbox com texto descritivo

### 10.11 Notas pós-sessão
- [x] Após completar uma sessão, tela de notas aparece
- [x] Digite uma nota e clique em **"Salvar"**
- [x] Ou clique em **"Pular"** para ignorar

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

- [x] Nota criada com sucesso
- [x] Tags exibidas como badges
- [x] URL clicável

### 11.2 Editar Nota
- [x] Clique na nota existente
- [x] Altere o conteúdo adicionando `- Notificações push`
- [x] Salve e verifique se o conteúdo atualizou

### 11.3 Deletar Nota
- [x] Delete a nota de teste
- [x] Nota some da lista

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

- [x] 7 categorias criadas (5 despesa + 2 receita)

### 12.3 Registrar Receita (aba Transações)

| Campo | Valor sugerido |
|-------|---------------|
| Descrição | `Salário março` |
| Valor | `8500` |
| Data | Hoje |
| Conta | `Nubank` |
| Categoria | `Salário` |

- [x] Receita registrada
- [x] Saldo da conta Nubank atualiza → R$ 13.500

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

- [x] 3 despesas registradas
- [x] Saldos de cada conta atualizados corretamente

### 12.5 Rendas Fixas (aba Receitas/Despesas)

| Campo | Valor sugerido |
|-------|---------------|
| Nome | `Salário CLT` |
| Valor | `8500` |
| Conta | `Nubank` |
| Frequência | `Mensal` |
| Dia do mês | `5` |
| Auto-confirmar | ✅ Ligado |

- [x] Renda fixa criada
- [x] Aparece na lista de recorrências

### 12.6 Verificar Overview (aba Visão Geral)
- [x] Gráficos de receita vs despesa aparecem
- [x] Resumo de saldos por conta correto
- [x] Total geral correto (somatório de todas as contas)


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

- [x] 2 livros adicionados
- [n] Ambos com status "Lendo"
- [x] Progresso mostra 0%

### 13.2 Atualizar Progresso

Selecione "O Poder do Hábito" e clique em atualizar progresso:

| Campo | Valor sugerido |
|-------|---------------|
| Página Atual | `85` |

- [x] Progresso atualiza (85/408 = ~21%)
- [x] Log de leitura criado automaticamente

### 13.3 Atualizar Progresso novamente

| Campo | Valor sugerido |
|-------|---------------|
| Página Atual | `142` |

- [x] Progresso muda para ~35%
- [x] Novo log criado (57 páginas lidas)

### 13.4 Upload de PDF (aba PDFs)
- [x] Clique em "Carregar PDF"
- [x] Selecione um arquivo PDF qualquer
- [x] PDF aparece na lista
- [x] Clique para abrir no leitor de PDF

### 13.5 Leitor de PDF
- [x] PDF renderiza corretamente
- [x] Navegação de páginas funciona
- [x] Zoom funciona
- [x] Highlight/marcação funciona (selecione texto e marque)

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

- [x] 3 assuntos criados e listados

### 14.2 Iniciar Sessão de Estudo

Clique em "Estudar" ou "Nova sessão":

| Campo | Valor sugerido |
|-------|---------------|
| Assunto | `JavaScript Avançado` (selecionar) |
| Notas rápidas | `Closures, Promises, Event Loop` |
| Duração (min) | `45` |
| Agendar revisão | ✅ Ativado |

- [x] Timer de sessão inicia
- [x] Ao finalizar, sessão é registrada

### 14.3 Finalizar Sessão

Ao terminar a sessão (ou adiantar), a tela de confirmação aparece:

1. Verifique o resumo (assunto e duração)
2. Preencha o campo **Notas finais**:

| Campo | Valor sugerido |
|-------|---------------|
| Notas finais | `Entendi closures e lexical scope. Rever Promises rejeitadas.` |

3. Clique em **"Salvar"**

- [x] Tela de confirmação mostra resumo da sessão (assunto + tempo)
- [x] Campo "Notas finais" está visível e editável
- [x] Sessão salva com duração e notas
- [x] Revisão espaçada agendada (se ativado)

### 14.4 Auto-Teste (Perguntas pós-sessão)

Após salvar a sessão, o dialog de **auto-teste** abre automaticamente:

1. Preencha **3 a 5 perguntas** para testar seu conhecimento:

| Pergunta # | Valor sugerido |
|------------|---------------|
| 1 | `O que é uma closure em JavaScript?` |
| 2 | `Qual a diferença entre Promise.all e Promise.allSettled?` |
| 3 | `Explique as fases do Event Loop.` |

2. Clique em **"Salvar Perguntas"** (ou **"Pular"** para ignorar)

- [x] Dialog de auto-teste abre automaticamente após salvar sessão
- [x] Campos para 3 perguntas aparecem por padrão
- [x] Botão "+" permite adicionar até 5 perguntas
- [x] Botão "Pular" permite ignorar sem criar perguntas
- [x] Toast confirma salvamento das perguntas

### 14.5 Revisar Perguntas (via card de revisão)

1. Na seção **"Revisões de hoje"**, clique em uma revisão pendente
2. O dialog de detalhes da sessão abre mostrando:
   - Notas rápidas (se preenchidas na criação)
   - Notas finais (se preenchidas ao finalizar)
   - Perguntas do auto-teste

- [n] Notas rápidas e notas finais aparecem separadamente
- [x] Perguntas do auto-teste listadas para revisão
- [x] Botão "Concluir" marca a revisão como feita

### 14.6 Verificar Histórico de Sessões

1. Clique em um **assunto** para ver todas as sessões

- [x] Lista de sessões concluídas com duração
- [x] Duração total acumulada por assunto
- [x] Cronograma de revisões futuras visível na tela principal

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

- [x] Check-in salvo
- [x] Aparece no histórico

### 15.2 Segundo Check-in (editar)
- [x] Edite o check-in de hoje
- [x] Mude horas de sono para `8`
- [x] Mude energia para `Alto`
- [x] Salve e verifique se atualizou

### 15.3 Criar Programa de Bem-estar

| Campo | Valor sugerido |
|-------|---------------|
| Tipo | `sleep` (Sono) |
| Duração | `7 dias` |

- [x] Programa criado
- [x] Ações diárias aparecem para serem concluídas

### 15.4 Criar segundo programa

| Campo | Valor sugerido |
|-------|---------------|
| Tipo | `focus` (Foco) |
| Duração | `14 dias` |

- [x] Programa criado com 14 dias de ações

### 15.5 Completar ação do programa
- [x] Marque uma ação do dia como concluída
- [x] Progresso do programa atualiza

### 15.6 Verificar Insights

1. Clique em **"Ver Insights"** na seção de ações rápidas
2. O dialog de Insights abre com seletor de período (7, 14, 30 dias)
3. Verifique:

| Seção | O que verificar |
|-------|----------------|
| Resumo | Cards com média de sono, energia e humor + indicadores de tendência |
| Gráfico Sono | Gráfico de área com horas de sono por dia |
| Gráfico Energia | Gráfico de barras com nível de energia (Baixo/Médio/Alto) |
| Gráfico Humor | Gráfico de barras com nível de humor (Baixo/Médio/Alto) |
| Consistência | Texto com quantidade de check-ins e percentual |

4. Troque o período para **7 dias** e depois para **30 dias**

- [x] Botão "Ver Insights" visível na tela principal
- [x] Dialog abre com gráficos de sono, energia e humor
- [x] Seletor de período (7/14/30 dias) funciona
- [x] Cards de resumo mostram médias e tendências (Subindo/Caindo/Estável)
- [x] Gráficos respondem corretamente ao período selecionado

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
