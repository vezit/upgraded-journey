// pages/_app.tsx
import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect, useState } from 'react'
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/router'
import { pageview } from '@/lib/analytics'
import { useGraph } from '@/contexts/GraphStore'
import { useVault } from '@/contexts/VaultStore'
import { loadVault } from '@/lib/storage'
import { parseVault } from '@/lib/parseVault'
import AlphaBanner from '@/components/AlphaBanner'
import Header from '@/components/Header'

export default function App({ Component, pageProps }: AppProps) {
  const { setGraph } = useGraph()
  const { setVault } = useVault()
  const router = useRouter()
  const [supabase] = useState(() => createBrowserSupabaseClient())
  useEffect(() => {
    const raw = loadVault()
    if (raw) {
      setVault(raw)
      setGraph(parseVault(raw))
    }
  }, [setGraph, setVault])

  useEffect(() => {
    const handleRouteChange = (url: string) => pageview(url)
    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router])
  return (
    <SessionContextProvider supabaseClient={supabase}>
      <AlphaBanner />
      <Header />
      <Component {...pageProps} />
    </SessionContextProvider>
  )

}
