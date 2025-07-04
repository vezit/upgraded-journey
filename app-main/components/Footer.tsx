'use client'
import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'

const THEME_KEY = 'theme'

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else if (theme === 'light') {
    root.classList.remove('dark')
  } else {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }
}

export default function Footer() {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY) as Theme | null
    if (saved) setTheme(saved)
    else applyTheme('light')
  }, [])

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme)
    applyTheme(theme)
    if (theme === 'system') {
      const mql = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => applyTheme('system')
      mql.addEventListener('change', handler)
      return () => mql.removeEventListener('change', handler)
    }
  }, [theme])

  return (
    <footer className="mt-auto p-4 text-center">
      <div className="flex justify-center gap-2">
        <button onClick={() => setTheme('light')} className={theme==='light' ? 'underline' : ''}>Light</button>
        <span>|</span>
        <button onClick={() => setTheme('dark')} className={theme==='dark' ? 'underline' : ''}>Dark</button>
        <span>|</span>
        <button onClick={() => setTheme('system')} className={theme==='system' ? 'underline' : ''}>System</button>
      </div>
    </footer>
  )
}
