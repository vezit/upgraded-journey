'use client'
import ReactFlow, { MiniMap, Controls, Background } from 'reactflow'
import 'reactflow/dist/style.css'
import { useGraph } from '@/contexts/GraphStore'

export default function VaultDiagram(){
  const { nodes, edges } = useGraph()
  return (
    <div style={{height:'70vh'}}>
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  )
}
