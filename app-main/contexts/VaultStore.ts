'use client'
import { create } from 'zustand'

// ---------------------------------------------------------------------------
// Helper to guess a domain from a service name
// ---------------------------------------------------------------------------
const SERVICE_DOMAINS: Record<string, string> = {
  instagram: 'instagram.com',
  facebook: 'facebook.com',
  gmail: 'gmail.com',
  google: 'google.com',
  linkedin: 'linkedin.com',
  netflix: 'netflix.com',
  twitter: 'twitter.com',
}

const guessDomainFromName = (name?: string): string | null => {
  if (!name) return null
  const key = name.trim().toLowerCase()
  if (SERVICE_DOMAINS[key]) return SERVICE_DOMAINS[key]
  const sanitized = key.replace(/[^a-z0-9]/g, '')
  if (sanitized.length < 3) return null
  return `${sanitized}.com`
}

interface VaultState {
  vault: any | null
  setVault: (v: any) => void
  updateItem: (index: number, field: string, value: string) => void
  addRecovery: (sourceId: string, targetId: string) => void
  addRecoverySlug: (srcSlug: string, tgtSlug: string) => void
  addTwofa: (serviceSlug: string, providerSlug: string) => void
  removeRecovery: (sourceId: string, targetId: string) => void
  removeTwofa: (serviceId: string, providerId: string) => void
  createItem: (item: {
    name: string
    slug: string
    username?: string
    password?: string
    totp?: string
    uri?: string
    notes?: string
    isRecovery?: boolean
  }) => void
  updateItemBySlug: (
    slug: string,
    field: 'name' | 'username' | 'password' | 'totp' | 'uri' | 'notes',
    value: string
  ) => void
}

export const useVault = create<VaultState>((set, get) => {
  const getVD = (item: any) => {
    const raw = item.fields?.find((f: any) => f.name === 'vaultdiagram')?.value
    if (!raw) return {}
    try {
      return JSON.parse(raw)
    } catch {
      return {}
    }
  }
  const setVD = (item: any, vd: any) => {
    let fields = item.fields ? [...item.fields] : []
    const idx = fields.findIndex((f: any) => f.name === 'vaultdiagram')
    const value = JSON.stringify(vd)
    if (idx > -1) fields[idx] = { ...fields[idx], value }
    else fields.push({ name: 'vaultdiagram', value, type: 0 })
    item.fields = fields
  }

  return {
    vault: null,
    setVault: (v) => set({ vault: v }),
    updateItem: (index, field, value) => {
      const v = get().vault
      if (!v || !v.items) return
      const items = [...v.items]
      const item = { ...items[index] }
      if (field === 'name') item.name = value
      else if (field === 'username')
        item.login = { ...item.login, username: value }
      else if (field === 'password')
        item.login = { ...item.login, password: value }
      else if (field === 'uri') {
        const uris = item.login?.uris?.length
          ? [...item.login.uris]
          : [{ match: null, uri: '' }]
        uris[0] = { ...uris[0], uri: value }
        item.login = { ...item.login, uris }
      }
      items[index] = item
      set({ vault: { ...v, items } })
    },
    addRecovery: (sourceId, targetId) => {
      const v = get().vault
      if (!v || !v.items) return
      const items = [...v.items]

      const srcIdx = items.findIndex((i: any) => String(i.id) === sourceId)
      const tgtIdx = items.findIndex((i: any) => String(i.id) === targetId)
      if (srcIdx === -1 || tgtIdx === -1) return

      const src = { ...items[srcIdx] }
      const tgt = { ...items[tgtIdx] }

      const srcVD = getVD(src)
      const tgtVD = getVD(tgt)
      if (!srcVD.id || !tgtVD.id) return

      const updateMap = (
        vd: any,
        key: 'recovers' | 'recovered_by',
        slug: string
      ) => {
        const map = vd.recoveryMap || {}
        const arr = Array.isArray(map[key]) ? map[key] : []
        if (!arr.includes(slug)) arr.push(slug)
        map[key] = arr
        vd.recoveryMap = map
      }

      updateMap(tgtVD, 'recovers', srcVD.id)
      updateMap(srcVD, 'recovered_by', tgtVD.id)

      setVD(src, srcVD)
      setVD(tgt, tgtVD)

      items[srcIdx] = src
      items[tgtIdx] = tgt

      set({ vault: { ...v, items } })
    },
    addRecoverySlug: (srcSlug, tgtSlug) => {
      const v = get().vault
      if (!v || !v.items) return
      const items = [...v.items]

      const srcIdx = items.findIndex((i: any) => getVD(i).id === srcSlug)
      const tgtIdx = items.findIndex((i: any) => getVD(i).id === tgtSlug)
      if (srcIdx === -1 || tgtIdx === -1) return

      const src = { ...items[srcIdx] }
      const tgt = { ...items[tgtIdx] }

      const srcVD = getVD(src)
      const tgtVD = getVD(tgt)
      const updateMap = (
        vd: any,
        key: 'recovers' | 'recovered_by',
        slug: string
      ) => {
        const map = vd.recoveryMap || {}
        const arr = Array.isArray(map[key]) ? map[key] : []
        if (!arr.includes(slug)) arr.push(slug)
        map[key] = arr
        vd.recoveryMap = map
      }

      updateMap(tgtVD, 'recovers', srcSlug)
      updateMap(srcVD, 'recovered_by', tgtSlug)

      setVD(src, srcVD)
      setVD(tgt, tgtVD)

      items[srcIdx] = src
      items[tgtIdx] = tgt

      set({ vault: { ...v, items } })
    },
    addTwofa: (serviceSlug, providerSlug) => {
      const v = get().vault
      if (!v || !v.items) return
      const items = [...v.items]

      const idx = items.findIndex((i: any) => getVD(i).id === serviceSlug)
      if (idx === -1) return

      const item = { ...items[idx] }
      const vd = getVD(item)
      const arr = Array.isArray(vd.twofaMap?.providers)
        ? vd.twofaMap.providers
        : []
      if (!arr.includes(providerSlug)) {
        vd.twofaMap = {
          ...(vd.twofaMap || {}),
          providers: [...arr, providerSlug],
        }
      }
      setVD(item, vd)

      items[idx] = item
      set({ vault: { ...v, items } })
    },
    removeRecovery: (sourceId: string, targetId: string) => {
      const v = get().vault
      if (!v || !v.items) return
      const items = [...v.items]

      const srcIdx = items.findIndex((i: any) => String(i.id) === sourceId)
      const tgtIdx = items.findIndex((i: any) => String(i.id) === targetId)
      if (srcIdx === -1 || tgtIdx === -1) return

      const src = { ...items[srcIdx] }
      const tgt = { ...items[tgtIdx] }

      const srcVD = getVD(src)
      const tgtVD = getVD(tgt)
      if (!srcVD.id || !tgtVD.id) return

      const updateMap = (
        vd: any,
        key: 'recovers' | 'recovered_by',
        slug: string
      ) => {
        const map = vd.recoveryMap || {}
        const arr = Array.isArray(map[key]) ? map[key] : []
        vd.recoveryMap = {
          ...map,
          [key]: arr.filter((s: string) => s !== slug),
        }
      }

      updateMap(tgtVD, 'recovers', srcVD.id)
      updateMap(srcVD, 'recovered_by', tgtVD.id)

      setVD(src, srcVD)
      setVD(tgt, tgtVD)

      items[srcIdx] = src
      items[tgtIdx] = tgt

      set({ vault: { ...v, items } })
    },
    removeTwofa: (serviceId: string, providerId: string) => {
      const v = get().vault
      if (!v || !v.items) return
      const items = [...v.items]

      const serviceIdx = items.findIndex((i: any) => String(i.id) === serviceId)
      const providerIdx = items.findIndex((i: any) => String(i.id) === providerId)
      if (serviceIdx === -1 || providerIdx === -1) return

      const service = { ...items[serviceIdx] }
      const provider = { ...items[providerIdx] }
      const providerSlug = getVD(provider).id
      if (!providerSlug) return

      const serviceVD = getVD(service)
      const arr = Array.isArray(serviceVD.twofaMap?.providers)
        ? serviceVD.twofaMap.providers
        : []
      serviceVD.twofaMap = {
        providers: arr.filter((s: string) => s !== providerSlug),
      }
      setVD(service, serviceVD)

      items[serviceIdx] = service

      set({ vault: { ...v, items } })
    },
    createItem: (itemData) => {
      const v = get().vault
      if (!v || !v.items) return
      const items = [...v.items]
      const item: any = {
        id: (crypto as any).randomUUID(),
        type: 1,
        name: itemData.name,
        login: {},
        fields: [],
      }
      if (itemData.username) item.login.username = itemData.username
      if (itemData.password) item.login.password = itemData.password
      if (itemData.totp) item.login.totp = itemData.totp
      const uriGuess =
        itemData.uri || `https://${guessDomainFromName(itemData.name) || ''}`
      if (uriGuess && uriGuess !== 'https://')
        item.login.uris = [{ uri: uriGuess, match: null }]
      if (itemData.notes) item.notes = itemData.notes
      const vd: any = { id: itemData.slug }
      if (itemData.isRecovery) vd.recoveryNode = true
      setVD(item, vd)

      items.push(item)
      set({ vault: { ...v, items } })
    },
    updateItemBySlug: (slug, field, value) => {
      const v = get().vault
      if (!v || !v.items) return
      const items = [...v.items]
      const idx = items.findIndex((i: any) => getVD(i).id === slug)
      if (idx === -1) return

      const item = { ...items[idx] }
      if (field === 'name') item.name = value
      else if (field === 'username')
        item.login = { ...item.login, username: value }
      else if (field === 'password')
        item.login = { ...item.login, password: value }
      else if (field === 'totp')
        item.login = { ...item.login, totp: value }
      else if (field === 'uri') {
        const uris = item.login?.uris?.length
          ? [...item.login.uris]
          : [{ match: null, uri: '' }]
        uris[0] = { ...uris[0], uri: value }
        item.login = { ...item.login, uris }
      } else if (field === 'notes') {
        item.notes = value
      }

      items[idx] = item
      set({ vault: { ...v, items } })
    },
  }
})

