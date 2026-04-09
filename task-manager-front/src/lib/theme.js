const THEME_STORAGE_KEY = 'app-theme'

export const getSystemTheme = () => {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const getStoredTheme = () => {
  if (typeof window === 'undefined') return null
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  return savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : null
}

export const getEffectiveTheme = () => getStoredTheme() || getSystemTheme()

export const applyTheme = (theme) => {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', theme)
}

export const initializeTheme = () => {
  const theme = getEffectiveTheme()
  applyTheme(theme)
  return theme
}

export const persistTheme = (theme) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(THEME_STORAGE_KEY, theme)
}

export const toggleTheme = (currentTheme) => {
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark'
  persistTheme(nextTheme)
  applyTheme(nextTheme)
  return nextTheme
}
