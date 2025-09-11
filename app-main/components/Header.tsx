'use client'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageStore'
import { useEffect } from 'react'

const labels = {
  en: { home: 'Home', diagram: 'Diagram', upload: 'Upload', onboarding: 'Onboarding', onboardingV2: 'AI Setup', chatgpt: 'AI Chat', about: 'About', en: 'English', da: 'Dansk' },
  da: { home: 'Hjem', diagram: 'Diagram', upload: 'Upload', onboarding: 'Onboarding', onboardingV2: 'AI Setup', chatgpt: 'AI Chat', about: 'Om', en: 'Engelsk', da: 'Dansk' }
}

export default function Header() {
  const { lang, setLang } = useLanguage()

  useEffect(() => {
    const saved = localStorage.getItem('lang') as 'en' | 'da' | null
    if (saved) setLang(saved)
  }, [setLang])

  useEffect(() => {
    localStorage.setItem('lang', lang)
  }, [lang])

  const t = labels[lang]

  return (
    <header className="bg-gray-800 text-white p-4 flex justify-between">
      <nav className="flex gap-4">
        <Link href="/">{t.home}</Link>
        <Link href="/vaultOnboarding">{t.onboarding}</Link>
        <Link href="/vaultOnboardingV2">{t.onboardingV2}</Link>
        <Link href="/vaultDiagram">{t.diagram}</Link>
        <Link href="/vaultUpload">{t.upload}</Link>
        <Link href="/vaultChatGPT">{t.chatgpt}</Link>
        <Link href="/about">{t.about}</Link>
      </nav>
      <div className="flex gap-2">
        <button onClick={() => setLang('en')} className={lang==='en' ? 'underline' : ''}>{t.en}</button>
        <span>|</span>
        <button onClick={() => setLang('da')} className={lang==='da' ? 'underline' : ''}>{t.da}</button>
      </div>
    </header>
  )
}
