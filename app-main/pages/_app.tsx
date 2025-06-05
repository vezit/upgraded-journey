// pages/_app.tsx
import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import { useGraph } from '@/contexts/GraphStore'
import { loadVault } from '@/lib/storage'

export default function App({ Component, pageProps }: AppProps) {
  const { setGraph } = useGraph()
  useEffect(()=>{
    const g = loadVault()
    if(g) setGraph(g)
  },[setGraph])
  return <Component {...pageProps} />
}
