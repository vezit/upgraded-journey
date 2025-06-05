'use client'
import { create } from 'zustand'
import { Edge, Node, NodeChange, EdgeChange, applyNodeChanges, applyEdgeChanges } from 'reactflow'
import { VaultGraph } from '@/lib/parseVault'

interface GraphState {
  nodes: Node[]
  edges: Edge[]
  setGraph: (g: VaultGraph)=>void
  onNodesChange: (changes: NodeChange[])=>void
  onEdgesChange: (changes: EdgeChange[])=>void
  updateNodeData: (id:string, data:any)=>void
}

export const useGraph = create<GraphState>(set=>({
  nodes: [],
  edges: [],
  setGraph: g => set(g),
  onNodesChange: changes => set(state=>({ nodes: applyNodeChanges(changes,state.nodes) })),
  onEdgesChange: changes => set(state=>({ edges: applyEdgeChanges(changes,state.edges) })),
  updateNodeData: (id,data) => set(state=>({ nodes: state.nodes.map(n=>n.id===id? { ...n, data:{...n.data,...data} }: n) }))
}))
