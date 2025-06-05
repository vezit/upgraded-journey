'use client'
import { create } from 'zustand'

interface HoverState {
  hoveredId: string | null
  setHoveredId: (id: string | null) => void
}

export const useHoverStore = create<HoverState>((set) => ({
  hoveredId: null,
  setHoveredId: (id) => set({ hoveredId: id })
}))
