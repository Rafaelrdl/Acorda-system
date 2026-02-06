# Sugestões de Hábitos - Implementação Completa

## 🎯 Resumo da Implementação

Adicionado bloco "Sugestões rápidas" no modal de criar hábito para novos usuários, permitindo criar hábitos com 1 clique sem copiar UI externa, mantendo o design minimalista do app.

## ✅ Arquivos Criados

### 1. **src/constants/habitSuggestions.ts**
- Array `HABIT_SUGGESTIONS` com 10 sugestões pré-definidas em pt-BR
- Cada sugestão com: `id`, `title`, `emoji`, `cadence` (daily/weekly), `targetMinutes` (opcional), `description`
- Sugestões:
  - 💧 Beber água
  - 🚶 Caminhada 10 min
  - 🧘 Meditar 5 min
  - 📖 Ler 10 min
  - ✍️ Diário 2 min
  - 🧘‍♂️ Alongar
  - 🌙 Dormir cedo
  - 🧹 Organizar 10 min
  - 🙏 Gratidão
  - 💪 Exercício

### 2. **src/components/dialogs/HabitSuggestions.tsx**
- Componente que renderiza sugestões em chips com scroll horizontal (mobile-first)
- Props:
  - `suggestions`: Array de sugestões
  - `existingTitles`: Títulos de hábitos existentes para detectar duplicados
  - `onPick(suggestion)`: Callback ao clicar em uma sugestão
  - `disabled`: Flag para desabilitar sugestões
- Acessibilidade:
  - `aria-label` descritivo em cada chip
  - Navegação por teclado (Tab, Enter)
  - Foco visível
  - Chips desabilitados para hábitos que já existem

### 3. **src/lib/__tests__/habitSuggestions.test.ts**
- Testes para `normalizeTitle()` (7 testes, todos passando)
- Validação de casos: espaços, maiúsculas, colapse de espaços, detecção de duplicados

## ✅ Arquivos Modificados

### 1. **src/lib/types.ts**
- Adicionado campo `hasSeenHabitSuggestions?: boolean` em `UserSettings`
- Padrão: `false` para novos usuários

### 2. **src/lib/helpers.ts**
- Adicionada função `normalizeTitle(title: string): string`
  - Normaliza títulos: trim + lowercase + colapsa espaços
  - Usada para validação de duplicados
- Atualizada factory `createUserSettings()`
  - Novo campo `hasSeenHabitSuggestions: false` por padrão

### 3. **src/components/dialogs/HabitDialog.tsx**
- Adicionadas props:
  - `habits?: Habit[]` - Lista de hábitos para validação
  - `hasSeenSuggestions?: boolean` - Flag para mostrar/esconder sugestões
  - `onMarkSuggestionsAsViewed?: ()` - Callback ao primeiro hábito criado
- Lógica:
  - Mostra `<HabitSuggestions>` quando `habits.length === 0` OU `!hasSeenSuggestions`
  - Ao clicar em sugestão: valida duplicado, cria hábito, marca como visto
  - Toast de sucesso ou erro ao adicionar

### 4. **src/components/tabs/PlanejarTab.tsx**
- Adicionadas props:
  - `hasSeenHabitSuggestions?: boolean`
  - `onMarkHabitSuggestionsAsViewed?: () => void`
- Passa props ao `<HabitDialog>`

### 5. **src/App.tsx**
- Adicionada função `handleMarkHabitSuggestionsAsViewed()`
  - Seta `userSettings.hasSeenHabitSuggestions = true`
  - Atualiza `updatedAt` para sincronização
- Modificado `handleAddHabit()`
  - Detecta primeiro hábito: `habits.length === 0`
  - Chama `handleMarkHabitSuggestionsAsViewed()` automaticamente
- Passa novas props ao `<PlanejarTab>`

## 🔍 Validação de Requisitos

✅ **1. Mostrar sugestões quando**: 
- `habits.length === 0` OU `hasSeenHabitSuggestions === false`

✅ **2. Renderizar 8-12 sugestões em chips/botões**:
- 10 sugestões pré-definidas
- Mobile-first com scroll horizontal
- Grid responsivo (flex em mobile, wrap em desktop)

✅ **3. Criar hábito imediatamente ao clicar**:
- Usa mesmo fluxo do formulário (`createHabit`, `onSave`)
- Valida duplicados: normaliza título para comparação
- Toast: "Hábito adicionado!" ou "Você já tem esse hábito"
- Seta `hasSeenHabitSuggestions = true` automaticamente

✅ **4. Persistência de hasSeenHabitSuggestions**:
- Armazenado em `UserSettings`
- Sincronizável via backend (já integrado ao sistema de sync)
- Default `false` para novos usuários

✅ **5. Acessibilidade**:
- `aria-label`: "Adicionar hábito: {title}"
- Navegação por teclado (Tab, Enter, Space)
- Foco visível com classes tailwind padrão
- Chips desabilitados com feedback visual

✅ **6. UI Minimalista**:
- Sem dependências pesadas
- Reutiliza componentes existentes (`Button`, `cn` utils)
- Design consistente com resto do app
- Sem telas novas

## 🧪 Testes

```bash
npm test -- src/lib/__tests__/habitSuggestions.test.ts
```

Resultado: **7 testes passando** ✓
- normalizeTitle remove espaços
- normalizeTitle converte para minúsculas
- normalizeTitle collapsa múltiplos espaços
- normalizeTitle trata casos mistos
- normalizeTitle retorna vazio para whitespace
- normalizeTitle simples
- Detecção correta de duplicados

## 📝 Fluxo de Uso

1. **Novo usuário sem hábitos**: Ver "Sugestões rápidas" no modal
2. **Clica em sugestão**: Hábito criado, toast "Hábito adicionado!"
3. **Reabre modal**: Sugestões desaparecem (`hasSeenHabitSuggestions = true`)
4. **Tenta adicionar duplicado**: Toast "Você já tem esse hábito"
5. **Sincronização**: Flag persiste no backend automaticamente

## 🔧 Próximos Passos Opcionais

- Adicionar analytics: rastrear qual sugestão foi escolhida
- Permitir custom sugestões por módulo
- A/B test de diferentes sugestões
- Migração de usuários existentes (setar `hasSeenHabitSuggestions = true`)

## 📦 Dependências

Nenhuma dependência nova adicionada. Usa:
- React (já incluído)
- Sonner (toast - já incluído)
- Tailwind CSS (estilos - já incluído)
