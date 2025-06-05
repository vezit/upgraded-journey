'use client'
import { create } from 'zustand'

interface VaultState {
  vault: any | null
  setVault: (v: any) => void
  updateItem: (index: number, field: string, value: string) => void
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
}))
