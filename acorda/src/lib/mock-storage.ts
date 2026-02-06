// Mock implementation of KV storage using localStorage
import { useState, useEffect, useCallback, useRef } from 'react'

const KV_PREFIX = 'acorda_kv_'

export const mockKV = {
  keys(): string[] {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(KV_PREFIX)) {
        keys.push(key.substring(KV_PREFIX.length))
      }
    }
    return keys
  },

  get<T>(key: string): T | undefined {
    const value = localStorage.getItem(KV_PREFIX + key)
    if (value === null) return undefined
    try {
      return JSON.parse(value) as T
    } catch {
      return undefined
    }
  },

  set<T>(key: string, value: T): void {
    localStorage.setItem(KV_PREFIX + key, JSON.stringify(value))
  },

  delete(key: string): void {
    localStorage.removeItem(KV_PREFIX + key)
  }
}

// Hook useKV estável - retorna [data, setData]
export function useKV<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  // Usa ref para manter o defaultValue estável
  const defaultRef = useRef(defaultValue)
  
  // Mantém a key anterior para detectar mudanças
  const prevKeyRef = useRef(key)
  
  // Inicializa com valor do localStorage ou default
  const [data, setData] = useState<T>(() => {
    const stored = mockKV.get<T>(key)
    if (stored !== undefined) {
      return stored
    }
    // Se não há dados salvos, salva o default imediatamente
    mockKV.set(key, defaultRef.current)
    return defaultRef.current
  })

  // Carrega dados do localStorage apenas quando a key muda
  useEffect(() => {
    if (prevKeyRef.current !== key) {
      prevKeyRef.current = key
      const stored = mockKV.get<T>(key)
      if (stored !== undefined) {
        setData(stored)
      } else {
        // Se não há dados para a nova key, salva o default
        mockKV.set(key, defaultRef.current)
        setData(defaultRef.current)
      }
    }
  }, [key])

  // Função para atualizar dados - estável
  const updateData = useCallback(
    (updater: T | ((prev: T) => T)) => {
      setData(prevData => {
        const newValue = typeof updater === 'function'
          ? (updater as (prev: T) => T)(prevData)
          : updater
        
        // Salva no localStorage de forma síncrona
        mockKV.set(key, newValue)
        return newValue
      })
    },
    [key]
  )

  return [data, updateData]
}