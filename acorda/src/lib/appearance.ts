/**
 * Helper functions for theme/appearance management.
 */

export type Appearance = 'light' | 'dark'

/**
 * Apply the specified theme to the document.
 * This adds/removes the 'dark' class from <html> and sets color-scheme.
 */
export function applyTheme(theme: Appearance): void {
  const root = document.documentElement
  
  if (import.meta.env.DEV) console.log('[Theme] Applying theme:', theme)
  
  if (theme === 'dark') {
    root.classList.add('dark')
    root.setAttribute('data-appearance', 'dark')
    root.style.colorScheme = 'dark'
    
    // Update theme-color meta tag for mobile browsers
    const themeColorMeta = document.querySelector('meta[name="theme-color"]')
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', '#09090b') // zinc-950
    }
  } else {
    root.classList.remove('dark')
    root.setAttribute('data-appearance', 'light')
    root.style.colorScheme = 'light'
    
    // Update theme-color meta tag for mobile browsers
    const themeColorMeta = document.querySelector('meta[name="theme-color"]')
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', '#ffffff')
    }
  }
}

/**
 * Get the system preferred color scheme.
 */
export function getSystemTheme(): Appearance {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}
