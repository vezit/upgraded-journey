'use client'
import { create } from 'zustand'
import { generateKey } from '../lib/hiddenCrypto'
import { useVault } from './VaultStore'

interface HiddenState {
  hidden: string[]
  key: string
  hide: (ids: string[]) => Promise<void>
  unhide: (ids: string[]) => Promise<void>
  clear: () => void
  regenerateKey: () => void
}
export const useHiddenStore = create<HiddenState>((set, get) => {
  let stored = ''
  if (typeof localStorage !== 'undefined') stored = localStorage.getItem('hidden-key') || ''
  const key = stored || generateKey()
  if (!stored && typeof localStorage !== 'undefined') localStorage.setItem('hidden-key', key)
  return {
    hidden: [],
    key,
    hide: async (ids) => {
      await useVault.getState().secureItems(ids, get().key)
      set(state => ({ hidden: Array.from(new Set([...state.hidden, ...ids])) }))
    },
    unhide: async (ids) => {
      await useVault.getState().revealItems(ids, get().key)
      set(state => ({ hidden: state.hidden.filter(id => !ids.includes(id)) }))
    },
    clear: () => set({ hidden: [] }),
    regenerateKey: () => {
      const newKey = generateKey()
      if (typeof localStorage !== 'undefined') localStorage.setItem('hidden-key', newKey)
      set({ key: newKey })
    },
  }
})
