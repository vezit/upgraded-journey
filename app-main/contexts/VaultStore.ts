'use client'
import { create } from 'zustand'

interface VaultState {
  vault: any | null
  setVault: (v: any) => void
  updateItem: (index: number, field: string, value: string) => void
  addRecovery: (sourceId: string, targetId: string) => void
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

    updateMap(src, 'recovers', slugTgt)
    updateMap(tgt, 'recovered_by', slugSrc)

    items[srcIdx] = src
    items[tgtIdx] = tgt

    set({ vault: { ...v, items } })
  },
}))
