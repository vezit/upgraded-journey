// pages/_app.tsx
import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import { useGraph } from '@/contexts/GraphStore'
import { useVault } from '@/contexts/VaultStore'
import { loadVault } from '@/lib/storage'
import { parseVault } from '@/lib/parseVault'

export default function App({ Component, pageProps }: AppProps) {
  const { setGraph } = useGraph()
  const { setVault } = useVault()
  useEffect(() => {
    const raw = loadVault()
    if (raw) {
      setVault(raw)
      setGraph(parseVault(raw))
    }
  }, [setGraph, setVault])
  return <Component {...pageProps} />
}
