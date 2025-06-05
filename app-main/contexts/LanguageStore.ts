'use client'
import { create } from 'zustand'

export type Lang = 'en' | 'da'

interface LanguageState {
  lang: Lang
  setLang: (l: Lang) => void
}

export const useLanguage = create<LanguageState>(set => ({
  lang: 'en',
  setLang: (l) => set({ lang: l })
}))
