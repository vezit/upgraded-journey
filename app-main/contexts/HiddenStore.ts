'use client'
import { create } from 'zustand'

interface HiddenState {
  hidden: string[]
  hide: (ids: string[]) => void
  unhide: (ids: string[]) => void
  clear: () => void
}

export const useHiddenStore = create<HiddenState>((set) => ({
  hidden: [],
  hide: (ids) => set(state => ({ hidden: Array.from(new Set([...state.hidden, ...ids])) })),
  unhide: (ids) => set(state => ({ hidden: state.hidden.filter(id => !ids.includes(id)) })),
  clear: () => set({ hidden: [] })
}))
