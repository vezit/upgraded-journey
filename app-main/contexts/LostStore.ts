'use client'
import { create } from 'zustand'

interface LostState {
  lost: string[]
  markLost: (id: string) => void
  clearLost: (id: string) => void
}

export const useLostStore = create<LostState>((set) => ({
  lost: [],
  markLost: (id) => set((state) => ({ lost: Array.from(new Set([...state.lost, id])) })),
  clearLost: (id) => set((state) => ({ lost: state.lost.filter((l) => l !== id) })),
}))
