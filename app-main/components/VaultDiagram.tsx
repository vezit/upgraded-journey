'use client'
import React, { useCallback } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  applyNodeChanges,
  NodeChange,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { useGraph } from '@/contexts/GraphStore'
import VaultNode from './VaultNode'

const nodeTypes = { vault: VaultNode }

export default function VaultDiagram() {
  const { nodes, edges, setGraph } = useGraph()

  // allow the user to drag nodes and keep the new coordinates in state
  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setGraph({
        nodes: applyNodeChanges(changes, nodes),
        edges,
      }),
    [setGraph, nodes, edges]
  )

  return (
    <div className="w-full h-[80vh] rounded-lg overflow-hidden border">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        fitView
      >
        <Background />
        <MiniMap pannable />
        <Controls />
      </ReactFlow>
    </div>
  )
}