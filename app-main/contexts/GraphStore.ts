'use client'
import { create } from 'zustand'
import { Edge, Node } from 'reactflow'
import { VaultGraph } from '@/lib/parseVault'

interface GraphState {
  nodes: Node[]
  edges: Edge[]
  setGraph: (g: VaultGraph) => void
  addEdge: (e: Edge) => void
}

export const useGraph = create<GraphState>(set => ({
  nodes: [],
  edges: [],
  setGraph: g => set(g),
  addEdge: e => set(state => ({ edges: [...state.edges, e] })),
}))
