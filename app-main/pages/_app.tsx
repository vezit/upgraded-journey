// pages/_app.tsx
import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect, useState } from 'react'
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { supabaseConfigured } from '@/lib/supabaseClient'
import { useRouter } from 'next/router'
import { pageview } from '@/lib/analytics'
import { useGraph } from '@/contexts/GraphStore'
import { useVault } from '@/contexts/VaultStore'
import { loadVault } from '@/lib/storage'
import { parseVault } from '@/lib/parseVault'
import AlphaBanner from '@/components/AlphaBanner'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function App({ Component, pageProps }: AppProps) {
  const { setGraph } = useGraph()
  const { setVault } = useVault()
  const router = useRouter()
  const [supabase] = useState(() =>
    supabaseConfigured ? createPagesBrowserClient() : null
  )

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

  // Pages that should not show footer
  const noFooterPages = ['/vaultOnboardingV2']
  const shouldShowFooter = !noFooterPages.includes(router.pathname)

  const content = (
    <>
      <AlphaBanner />
      <Header />
      <Component {...pageProps} />
      {shouldShowFooter && <Footer />}
    </>
  )

  return supabaseConfigured ? (
    <SessionContextProvider supabaseClient={supabase!}>
      {content}
    </SessionContextProvider>
  ) : (
    content
  )
}
