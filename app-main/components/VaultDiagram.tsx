'use client'
import ReactFlow, { MiniMap, Controls, Background } from 'reactflow'
import 'reactflow/dist/style.css'
import { useGraph } from '@/contexts/GraphStore'
import ItemNode from './ItemNode'

export default function VaultDiagram(){
  const { nodes, edges, onNodesChange, onEdgesChange } = useGraph()
  const nodeTypes = { vaultItem: ItemNode }
  return (
    <div style={{height:'70vh'}}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
      >
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  )
}
