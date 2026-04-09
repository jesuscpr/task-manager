import { useEffect, useState } from 'react'
import { initializeTheme, toggleTheme, getSystemTheme, getStoredTheme, applyTheme } from '../../lib/theme'
import { SunIcon, MoonIcon } from '../icons'

const ThemeToggle = () => {
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    setTheme(initializeTheme())
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleSystemThemeChange = () => {
      if (getStoredTheme()) return
      const systemTheme = getSystemTheme()
      applyTheme(systemTheme)
      setTheme(systemTheme)
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange)
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange)
  }, [])

  return (
    <button
      type="button"
      className="theme-toggle-btn"
      onClick={() => setTheme((prevTheme) => toggleTheme(prevTheme))}
      aria-label={`Cambiar a tema ${theme === 'dark' ? 'claro' : 'oscuro'}`}
      title={`Cambiar a tema ${theme === 'dark' ? 'claro' : 'oscuro'}`}
    >
      {theme === 'dark' ? <MoonIcon className="theme-toggle-svg" /> : <SunIcon className="theme-toggle-svg" />}
    </button>
  )
}

export default ThemeToggle
