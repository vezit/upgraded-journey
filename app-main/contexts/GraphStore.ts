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
  setGraph: g =>
    set(() => {
      const nodeIds = new Set(g.nodes.map(n => n.id))
      const filtered = g.edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))
      return { nodes: g.nodes, edges: filtered }
    }),
  addEdge: e => set(state => ({ edges: [...state.edges, e] })),
}))
