import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageStore'

export default function Home() {
  const { lang } = useLanguage()

  const t = {
    en: {
      title: 'Welcome to Vaultdiagram',
      intro: 'This application visualizes your Bitwarden vault and helps you understand recovery relationships.',
      open: 'Open Diagram',
      guide: 'Guide'
    },
    da: {
      title: 'Velkommen til Vaultdiagram',
      intro: 'Dette program viser dit Bitwarden-hvelv som et diagram og forklarer gendannelsesforhold.',
      open: 'Åbn diagram',
      guide: 'Vejledning'
    }
  }

  const l = t[lang]

  return (
    <main className="flex flex-col items-center justify-center gap-6 min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-semibold">{l.title}</h1>
      <p className="max-w-xl text-center text-lg px-4">{l.intro}</p>
      <Link href="/vaultDiagram" className="px-4 py-2 bg-blue-600 rounded">
        {l.open}
      </Link>
      <a
        href="https://vault.reipur.dk"
        target="_blank"
        rel="noopener noreferrer"
        className="underline text-blue-400"
      >
        {l.guide}
      </a>
    </main>
  )
}
