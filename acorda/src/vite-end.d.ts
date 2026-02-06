/// <reference types="vite/client" />

// Spark AI global declarations
declare const spark: {
  llmPrompt: (strings: TemplateStringsArray, ...values: unknown[]) => string
  llm: (prompt: string, model?: string, jsonMode?: boolean) => Promise<string>
}

// Declaração para imports de imagens
declare module '*.jpg' {
  const src: string
  export default src
}

declare module '*.png' {
  const src: string
  export default src
}

declare module '*.svg' {
  const src: string
  export default src
}