'use client'
import { create } from 'zustand'

interface LockedState {
  locked: string[]
  lock: (ids: string[]) => void
  unlock: (ids: string[]) => void
  clear: () => void
}

export const useLockedStore = create<LockedState>((set) => ({
  locked: [],
  lock: (ids) => set((state) => ({ locked: Array.from(new Set([...state.locked, ...ids])) })),
  unlock: (ids) => set((state) => ({ locked: state.locked.filter(id => !ids.includes(id)) })),
  clear: () => set({ locked: [] })
}))
