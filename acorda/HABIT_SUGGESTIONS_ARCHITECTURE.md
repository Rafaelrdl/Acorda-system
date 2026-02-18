# Arquitetura - Sugestões de Hábitos

## Fluxo de Dados

```text
App.tsx (Root)
│
├─ userSettings { hasSeenHabitSuggestions?: boolean }
├─ habits: Habit[]
│
└─ PlanejarTab
   └─ HabitDialog
      ├─ Props:
      │  ├─ habits (list of existing)
      │  ├─ hasSeenSuggestions (bool)
      │  └─ onMarkSuggestionsAsViewed (callback)
      │
      └─ HabitSuggestions
         ├─ HABIT_SUGGESTIONS (const data)
         ├─ normalizeTitle (util)
         └─ onPick (user interaction)

```

## Componentes

### HabitSuggestions.tsx

```text
┌─────────────────────────────────────┐
│ 💡 Sugestões rápidas                │
├─────────────────────────────────────┤
│                                     │
│ [💧 Beber água] [🚶 Caminhada 10m]  │
│ [🧘 Meditar 5m] [📖 Ler 10m]        │
│ [✍️ Diário 2m]  [🧘‍♂️ Alongar]       │
│ [🌙 Dormir cedo] [🧹 Organizar 10m] │
│                                     │
│ Hábitos com fundo cinzo já foram... │
└─────────────────────────────────────┘

```

## Duplicata Detection

```javascript
// normalizeTitle()
"Beber Água"        → "beber água"
"  beber  água  "   → "beber água"
"BEBER ÁGUA"        → "beber água"

// Validação
const existingTitles = ["beber água", "meditação"]
const suggestion = "Beber Água"
const normalized = normalizeTitle(suggestion.title)
const isDuplicate = existingTitles.includes(normalized)
// → isDuplicate = true ❌

```

## State Updates

### Quando Modal Abre

```text
if (open && !habit) {
  shouldShowSuggestions = (habits.length === 0) || !hasSeenSuggestions
  // Renderiza HabitSuggestions
}

```

### Quando Clica em Sugestão

```text
handleQuickPickSuggestion(suggestion):

  1. Normaliza título
  2. Valida duplicado → toast erro se existe
  3. Cria hábito com createHabit()
  4. Chama onSave(habitData)
  5. Chama onMarkSuggestionsAsViewed()
  6. Toast sucesso

```

### Primeiro Hábito Adicionado

```text
handleAddHabit(habit):

  1. Adiciona hábito ao state
  2. if (habits.length === 0):
       - handleMarkHabitSuggestionsAsViewed()
       - setUserSettings({ hasSeenHabitSuggestions: true })
  3. Toast "Hábito criado"

```

## Persistência

```text
UserSettings {
  id: string
  userId: UserId
  weekStartsOn: 0 | 1
  defaultPomodoroPreset?: string
  minimalMode: boolean
  appearance?: Appearance
  modules: ModuleSettings
  hasSeenHabitSuggestions?: boolean  ← NOVO
  createdAt: number
  updatedAt: number
}

```

Storage: Sincronizado via `useKV(getSyncKey(userId, 'userSettings'))`

## Testes

```text
normalizeTitle tests:
├─ removes leading and trailing whitespace ✓
├─ converts to lowercase ✓
├─ collapses multiple spaces into one ✓
├─ handles mixed case with extra spaces ✓
├─ returns empty string for whitespace-only input ✓
├─ returns lowercase for simple input ✓
└─ detects duplicates correctly ✓

All 7 tests passing ✓

```

## Acessibilidade Checklist

- ✓ aria-label em cada button: "Adicionar hábito: {title}"
- ✓ Navegação por teclado: Tab, Enter, Space
- ✓ Foco visível: Classes focus:outline-none focus:ring-2
- ✓ Estados desabilitados: opacity-50 cursor-not-allowed
- ✓ Assistive text: "Hábitos com fundo cinzo já foram adicionados"
- ✓ Semantic HTML: `<Button type="button">`

## Performance

- 0 dependências novas
- Normalização de string: O(n) onde n = length(title)
- Comparação de duplicados: O(m) onde m = length(habits)
- UI: Scroll horizontal em mobile (system-level optimization)
