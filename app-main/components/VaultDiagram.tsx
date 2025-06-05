'use client'
import React, { useCallback, useState, useEffect } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  applyNodeChanges,
  NodeChange,
  Node,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { useGraph } from '@/contexts/GraphStore'
import { useVault } from '@/contexts/VaultStore'
import ItemModal from './ItemModal'
import VaultNode from './VaultNode'

const nodeTypes = { vault: VaultNode }

export default function VaultDiagram() {
  const { nodes, edges, setGraph } = useGraph()
  const { vault } = useVault()
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

  return (
    <div className="relative w-full h-[80vh] rounded-lg overflow-hidden border">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onNodeContextMenu={(e:React.MouseEvent, n:Node)=>{
          e.preventDefault()
          setMenu({x:e.clientX,y:e.clientY,id:n.id})
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
        <ItemModal index={editIndex} onClose={()=>setEditIndex(null)} />
      )}
    </div>
  )
}