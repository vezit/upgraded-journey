'use client'
import { create } from 'zustand'

interface VaultState {
  vault: any | null
  setVault: (v: any) => void
  updateItem: (index: number, field: string, value: string) => void
  addRecovery: (sourceId: string, targetId: string) => void
  addRecoverySlug: (srcSlug: string, tgtSlug: string) => void
  addTwofa: (serviceSlug: string, providerSlug: string) => void
  createItem: (item: {
    name: string
    slug: string
    username?: string
    password?: string
    uri?: string
    isRecovery?: boolean
  }) => void
  updateItemBySlug: (
    slug: string,
    field: 'name' | 'username' | 'password' | 'uri',
    value: string
  ) => void
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
    if (itemData.uri) item.login.uris = [{ uri: itemData.uri, match: null }]
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
    else if (field === 'uri') {
      const uris = item.login?.uris?.length ? [...item.login.uris] : [{ match: null, uri: '' }]
      uris[0] = { ...uris[0], uri: value }
      item.login = { ...item.login, uris }
    }

    items[idx] = item
    set({ vault: { ...v, items } })
  },
}))
