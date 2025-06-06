'use client'
import { create } from 'zustand'
import { Edge, Node } from 'reactflow'
import { VaultGraph } from '@/lib/parseVault'

interface GraphState {
  nodes: Node[]
  edges: Edge[]
  setGraph: (g: VaultGraph) => void
  addEdge: (e: Edge) => void
  removeEdge: (id: string) => void
}

export const useGraph = create<GraphState>(set => ({
  nodes: [],
  edges: [],
  setGraph: g => set(g),
  addEdge: e => set(state => ({ edges: [...state.edges, e] })),
  removeEdge: id => set(state => ({ edges: state.edges.filter(e => e.id !== id) })),
}))
