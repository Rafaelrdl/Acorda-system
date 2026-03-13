import { Transaction, Book, ReadingLog, PDFHighlight, StudySession, FinanceCategory } from './types'

export function exportFinanceToCSV(transactions: Transaction[], categories: FinanceCategory[] = []): string {
  const categoryMap = new Map(categories.map(c => [c.id, c.name]))
  const headers = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Valor']
  const escapeField = (value: string) => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }
  const rows = transactions.map(t => [
    t.date,
    t.type === 'income' ? 'Receita' : t.type === 'expense' ? 'Despesa' : 'Transferência',
    escapeField(t.description || ''),
    escapeField(categoryMap.get(t.categoryId || '') || ''),
    Number(t.amount).toFixed(2)
  ])

  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')
}

export function exportStudyToMarkdown(studySessions: StudySession[]): string {
  const lines: string[] = ['# Estudos - Acorda\n']

  if (studySessions.length > 0) {
    lines.push('## Sessões de Estudo\n')
    studySessions.forEach(session => {
      lines.push(`### ${session.date}`)
      lines.push(`- Duração: ${session.durationMinutes} minutos`)
      if (session.quickNotes) {
        lines.push(`- Notas: ${session.quickNotes}`)
      }
      if (session.selfTestQuestions && session.selfTestQuestions.length > 0) {
        lines.push('\n**Perguntas de auto-teste:**')
        session.selfTestQuestions.forEach((q, i) => {
          lines.push(`${i + 1}. ${q}`)
        })
      }
      lines.push('')
    })
  } else {
    lines.push('_Nenhuma sessão de estudo registrada._\n')
  }

  return lines.join('\n')
}

export function exportReadingToMarkdown(
  books: Book[],
  readingLogs: ReadingLog[],
  pdfHighlights: PDFHighlight[]
): string {
  const lines: string[] = ['# Leitura - Acorda\n']

  if (books.length > 0) {
    lines.push('## Livros\n')
    books.forEach(book => {
      lines.push(`### ${book.title} - ${book.author}`)
      lines.push(`- Status: ${book.status}`)
      lines.push(`- Páginas: ${book.currentPage} / ${book.totalPages}`)
      if (book.notes) {
        lines.push(`- Notas: ${book.notes}`)
      }

      const logs = readingLogs.filter(l => l.bookId === book.id)
      if (logs.length > 0) {
        lines.push('\n**Histórico de leitura:**')
        logs.forEach(log => {
          lines.push(`- ${log.date}: ${log.pagesRead} páginas (${log.startPage}-${log.endPage})`)
          if (log.notes) {
            lines.push(`  Nota: ${log.notes}`)
          }
        })
      }
      lines.push('')
    })
  }

  if (pdfHighlights.length > 0) {
    lines.push('\n## Highlights de PDFs\n')
    const byDoc = pdfHighlights.reduce((acc, h) => {
      if (!acc[h.documentId]) acc[h.documentId] = []
      acc[h.documentId].push(h)
      return acc
    }, {} as Record<string, PDFHighlight[]>)

    Object.entries(byDoc).forEach(([docId, highlights]) => {
      lines.push(`### Documento ${docId}\n`)
      if (highlights && highlights.length > 0) {
        highlights.forEach(h => {
          lines.push(`**Página ${h.pageNumber}** (${h.color}):`)
          lines.push(`> ${h.text}`)
          if (h.note) {
            lines.push(`\nNota: ${h.note}`)
          }
          lines.push('')
        })
      }
    })
  }

  return lines.join('\n')
}

export function downloadFile(content: string, filename: string, type: string = 'text/plain') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
