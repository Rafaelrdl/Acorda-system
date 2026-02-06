import { ComponentProps, useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"

interface CurrencyInputProps extends Omit<ComponentProps<"input">, 'value' | 'onChange'> {
  value: string
  onChange: (value: string) => void
}

/**
 * Formata um valor numérico para o formato brasileiro de moeda
 * Ex: 254146 -> 2.541,46
 */
function formatCurrency(value: string): string {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '')
  
  if (!numbers) return ''
  
  // Converte para centavos (últimos 2 dígitos são decimais)
  const cents = parseInt(numbers, 10)
  
  // Formata com separadores brasileiros
  const formatted = (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  
  return formatted
}

/**
 * Extrai o valor numérico de uma string formatada
 * Ex: "2.541,46" -> "2541.46"
 */
function parseToFloat(value: string): string {
  if (!value) return ''
  
  // Remove pontos (separador de milhares) e troca vírgula por ponto
  const cleaned = value.replace(/\./g, '').replace(',', '.')
  
  return cleaned
}

function CurrencyInput({ 
  className, 
  value, 
  onChange,
  placeholder = "0,00",
  ...props 
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState('')

  // Sincroniza o valor externo com o display
  useEffect(() => {
    if (value) {
      // Se o valor externo mudou (ex: reset do form), atualiza o display
      const numValue = parseFloat(value)
      if (!isNaN(numValue) && numValue > 0) {
        const formatted = numValue.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
        setDisplayValue(formatted)
      } else {
        setDisplayValue('')
      }
    } else {
      setDisplayValue('')
    }
  }, [value])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    
    // Remove tudo que não é número
    const numbers = inputValue.replace(/\D/g, '')
    
    if (!numbers) {
      setDisplayValue('')
      onChange('')
      return
    }
    
    // Formata para exibição
    const formatted = formatCurrency(numbers)
    setDisplayValue(formatted)
    
    // Passa o valor numérico para o pai (formato que o sistema espera)
    const numericValue = parseToFloat(formatted)
    onChange(numericValue)
  }, [onChange])

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
        R$
      </span>
      <input
        type="text"
        inputMode="numeric"
        data-slot="input"
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent pl-9 pr-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          className
        )}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        {...props}
      />
    </div>
  )
}

export { CurrencyInput }
