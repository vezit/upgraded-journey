'use client'
import { create } from 'zustand'
import { encryptString, decryptString } from '../lib/hiddenCrypto'

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
  secureItems: (ids: string[], key: string) => Promise<void>
  revealItems: (ids: string[], key: string) => Promise<void>
}

export const useVault = create<VaultState>((set, get) => ({
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

    const slugSrc = src.fields?.find((f: any) => f.name === 'vaultdiagram-id')?.value
    const slugTgt = tgt.fields?.find((f: any) => f.name === 'vaultdiagram-id')?.value
    if (!slugSrc || !slugTgt) return

    const updateMap = (item: any, key: 'recovers' | 'recovered_by', slug: string) => {
      let field = item.fields?.find((f: any) => f.name === 'vaultdiagram-recovery-map')
      if (!field) {
        field = { name: 'vaultdiagram-recovery-map', value: '{}', type: 0 }
        item.fields = item.fields ? [...item.fields, field] : [field]
      }
      let map: any
      try {
        map = JSON.parse(field.value || '{}')
      } catch {
        map = {}
      }
      const arr = Array.isArray(map[key]) ? map[key] : []
      if (!arr.includes(slug)) arr.push(slug)
      map[key] = arr
      field.value = JSON.stringify(map)
    }

    // when connecting from a service to a recovery item we
    // store the relation as target.recovers -> source and
    // source.recovered_by -> target
    updateMap(tgt, 'recovers', slugSrc)
    updateMap(src, 'recovered_by', slugTgt)

    items[srcIdx] = src
    items[tgtIdx] = tgt

    set({ vault: { ...v, items } })
  },
  addRecoverySlug: (srcSlug, tgtSlug) => {
    const v = get().vault
    if (!v || !v.items) return
    const items = [...v.items]

    const srcIdx = items.findIndex((i: any) =>
      i.fields?.some((f: any) => f.name === 'vaultdiagram-id' && f.value === srcSlug)
    )
    const tgtIdx = items.findIndex((i: any) =>
      i.fields?.some((f: any) => f.name === 'vaultdiagram-id' && f.value === tgtSlug)
    )
    if (srcIdx === -1 || tgtIdx === -1) return

    const src = { ...items[srcIdx] }
    const tgt = { ...items[tgtIdx] }

    const updateMap = (item: any, key: 'recovers' | 'recovered_by', slug: string) => {
      let field = item.fields?.find((f: any) => f.name === 'vaultdiagram-recovery-map')
      if (!field) {
        field = { name: 'vaultdiagram-recovery-map', value: '{}', type: 0 }
        item.fields = item.fields ? [...item.fields, field] : [field]
      }
      let map: any
      try {
        map = JSON.parse(field.value || '{}')
      } catch {
        map = {}
      }
      const arr = Array.isArray(map[key]) ? map[key] : []
      if (!arr.includes(slug)) arr.push(slug)
      map[key] = arr
      field.value = JSON.stringify(map)
    }

    updateMap(tgt, 'recovers', srcSlug)
    updateMap(src, 'recovered_by', tgtSlug)

    items[srcIdx] = src
    items[tgtIdx] = tgt

    set({ vault: { ...v, items } })
  },
  addTwofa: (serviceSlug, providerSlug) => {
    const v = get().vault
    if (!v || !v.items) return
    const items = [...v.items]

    const idx = items.findIndex((i: any) =>
      i.fields?.some((f: any) => f.name === 'vaultdiagram-id' && f.value === serviceSlug)
    )
    if (idx === -1) return

    const item = { ...items[idx] }
    let field = item.fields?.find((f: any) => f.name === 'vaultdiagram-2fa-map')
    if (!field) {
      field = { name: 'vaultdiagram-2fa-map', value: '{}', type: 0 }
      item.fields = item.fields ? [...item.fields, field] : [field]
    }
    let map: any
    try {
      map = JSON.parse(field.value || '{}')
    } catch {
      map = {}
    }
    const arr = Array.isArray(map.providers) ? map.providers : []
    if (!arr.includes(providerSlug)) arr.push(providerSlug)
    map.providers = arr
    field.value = JSON.stringify(map)

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

    const slugSrc = src.fields?.find((f: any) => f.name === 'vaultdiagram-id')?.value
    const slugTgt = tgt.fields?.find((f: any) => f.name === 'vaultdiagram-id')?.value
    if (!slugSrc || !slugTgt) return

    const updateMap = (item: any, key: 'recovers' | 'recovered_by', slug: string) => {
      const field = item.fields?.find((f: any) => f.name === 'vaultdiagram-recovery-map')
      if (!field) return
      let map: any
      try {
        map = JSON.parse(field.value || '{}')
      } catch {
        map = {}
      }
      const arr = Array.isArray(map[key]) ? map[key] : []
      map[key] = arr.filter((s: string) => s !== slug)
      field.value = JSON.stringify(map)
    }

    updateMap(tgt, 'recovers', slugSrc)
    updateMap(src, 'recovered_by', slugTgt)

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
    const providerSlug = provider.fields?.find((f: any) => f.name === 'vaultdiagram-id')?.value
    if (!providerSlug) return

    const field = service.fields?.find((f: any) => f.name === 'vaultdiagram-2fa-map')
    if (!field) return

    let map: any
    try {
      map = JSON.parse(field.value || '{}')
    } catch {
      map = {}
    }
    const arr = Array.isArray(map.providers) ? map.providers : []
    map.providers = arr.filter((s: string) => s !== providerSlug)
    field.value = JSON.stringify(map)

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
      fields: [{ name: 'vaultdiagram-id', value: itemData.slug, type: 0 }],
    }
    if (itemData.username) item.login.username = itemData.username
    if (itemData.password) item.login.password = itemData.password
    if (itemData.totp) item.login.totp = itemData.totp
    const uriGuess = itemData.uri || `https://${guessDomainFromName(itemData.name) || ''}`
    if (uriGuess && uriGuess !== 'https://')
      item.login.uris = [{ uri: uriGuess, match: null }]
    if (itemData.notes) item.notes = itemData.notes
    if (itemData.isRecovery)
      item.fields.push({ name: 'recovery_node', value: 'true', type: 0 })

    items.push(item)
    set({ vault: { ...v, items } })
  },
  updateItemBySlug: (slug, field, value) => {
    const v = get().vault
    if (!v || !v.items) return
    const items = [...v.items]
    const idx = items.findIndex((i: any) =>
      i.fields?.some((f: any) => f.name === 'vaultdiagram-id' && f.value === slug)
    )
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
      const uris = item.login?.uris?.length ? [...item.login.uris] : [{ match: null, uri: '' }]
      uris[0] = { ...uris[0], uri: value }
      item.login = { ...item.login, uris }
    } else if (field === 'notes') {
      item.notes = value
    }

    items[idx] = item
    set({ vault: { ...v, items } })
  },
  secureItems: async (ids, key) => {
    const v = get().vault
    if (!v || !v.items) return
    const items = [...v.items]
    for (const id of ids) {
      const rawId = id.replace(/^item-/, '')
      const idx = items.findIndex(i => String(i.id) === rawId)
      if (idx === -1) continue
      const item = { ...items[idx] }
      const data = {
        username: item.login?.username,
        password: item.login?.password,
        totp: item.login?.totp,
        notes: item.notes,
      }
      const enc = await encryptString(JSON.stringify(data), key)
      item.fields = item.fields ? [...item.fields] : []
      const existing = item.fields.find((f: any) => f.name === 'vaultdiagram-hidden-data')
      if (existing) existing.value = await enc
      else item.fields.push({ name: 'vaultdiagram-hidden-data', value: await enc, type: 0 })
      if (item.login) {
        delete item.login.username
        delete item.login.password
        delete item.login.totp
      }
      delete item.notes
      items[idx] = item
    }
    set({ vault: { ...v, items } })
  },
  revealItems: async (ids, key) => {
    const v = get().vault
    if (!v || !v.items) return
    const items = [...v.items]
    for (const id of ids) {
      const rawId = id.replace(/^item-/, '')
      const idx = items.findIndex(i => String(i.id) === rawId)
      if (idx === -1) continue
      const item = { ...items[idx] }
      const fieldIdx = item.fields?.findIndex((f: any) => f.name === 'vaultdiagram-hidden-data')
      if (fieldIdx === undefined || fieldIdx < 0) continue
      const enc = item.fields![fieldIdx].value
      const plainStr = await decryptString(enc, key)
      const plain = JSON.parse(plainStr)
      item.login = item.login || {}
      if (plain.username) item.login.username = plain.username
      if (plain.password) item.login.password = plain.password
      if (plain.totp) item.login.totp = plain.totp
      if (plain.notes) item.notes = plain.notes
      item.fields!.splice(fieldIdx, 1)
      items[idx] = item
    }
    set({ vault: { ...v, items } })
  },
}))
