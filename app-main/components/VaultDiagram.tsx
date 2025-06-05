'use client'
import React, { useCallback, useState, useEffect, useRef } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  applyNodeChanges,
  addEdge,
  NodeChange,
  Node,
  Connection,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { useGraph } from '@/contexts/GraphStore'
import { useVault } from '@/contexts/VaultStore'
import EditItemModal from './EditItemModal'
import VaultNode from './VaultNode'

const nodeTypes = { vault: VaultNode }

export default function VaultDiagram() {
  const { nodes, edges, setGraph } = useGraph()
  const { vault } = useVault()
  const diagramRef = useRef<HTMLDivElement>(null)
  const [menu, setMenu] = useState<{x:number,y:number,id:string}|null>(null)
  const [editIndex, setEditIndex] = useState<number|null>(null)

  const handleEdit = (id: string) => {
    if(!vault) return
    const rawId = id.replace(/^item-/, '')
    const idx = vault.items?.findIndex((i:any)=> String(i.id)===rawId)
    if(idx!==undefined && idx>-1) setEditIndex(idx)
  }

  useEffect(()=>{
    const close = ()=>setMenu(null)
    document.addEventListener('click', close)
    return ()=>document.removeEventListener('click', close)
  },[])

  // allow the user to drag nodes and keep the new coordinates in state
  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setGraph({
        nodes: applyNodeChanges(changes, nodes),
        edges,
      }),
    [setGraph, nodes, edges]
  )

  const onConnect = useCallback(
    (conn: Connection) => {
      const targetNode = nodes.find(n => n.id === conn.target)
      if (!targetNode?.data?.isRecovery) {
        alert('Only recovery methods can be targets')
        return
      }
      setGraph({ nodes, edges: addEdge({ ...conn, style: { stroke: '#8b5cf6' } }, edges) })
    },
    [nodes, edges, setGraph]
  )

  return (
    <div ref={diagramRef} className="relative w-full h-[80vh] rounded-lg overflow-hidden border">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onConnect={onConnect}
        onNodeContextMenu={(e:React.MouseEvent, n:Node) => {
          e.preventDefault()
          const rect = diagramRef.current?.getBoundingClientRect()
          const x = rect ? e.clientX - rect.left : e.clientX
          const y = rect ? e.clientY - rect.top : e.clientY
          setMenu({ x, y, id: n.id })
        }}
        fitView
      >
        <Background />
        <MiniMap pannable />
        <Controls />
      </ReactFlow>
      {menu && (
        <ul
          className="absolute bg-white border rounded shadow text-sm"
          style={{top:menu.y,left:menu.x}}
        >
          <li
            className="px-3 py-1 cursor-pointer hover:bg-gray-100"
            onClick={()=>{handleEdit(menu.id);setMenu(null)}}
          >
            Edit Item
          </li>
        </ul>
      )}
      {editIndex!==null && (
        <EditItemModal index={editIndex} onClose={()=>setEditIndex(null)} />
      )}
    </div>
  )
}