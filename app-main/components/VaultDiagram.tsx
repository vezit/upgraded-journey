'use client'
import React, { useCallback, useState, useEffect, useRef } from 'react'
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
  applyNodeChanges,
  addEdge,
  NodeChange,
  Node,
  Edge,
  Connection,
  useStore,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { useGraph } from '@/contexts/GraphStore'
import { useVault } from '@/contexts/VaultStore'
import { useHiddenStore } from '@/contexts/HiddenStore'
import { useLockedStore } from '@/contexts/LockedStore'
import { useLostStore } from '@/contexts/LostStore'
import { parseVault } from '@/lib/parseVault'
import * as storage from '@/lib/storage'
import EditItemModal from './EditItemModal'
import VaultNode from './VaultNode'
import GroupNode from './GroupNode'
import LostModal from './LostModal'
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline'

const nodeTypes = { vault: VaultNode, group: GroupNode }

const orientEdges = (_nodes: Node[], edges: Edge[]): Edge[] => edges

function DiagramContent() {
  const { nodes, edges, setGraph, removeEdge } = useGraph()
  const { hidden } = useHiddenStore()
  const { locked } = useLockedStore()
  const { lost, clearLost, markLost } = useLostStore()
  const { vault, addRecovery, removeRecovery, removeTwofa } = useVault()
  const diagramRef = useRef<HTMLDivElement>(null)
  const [menu, setMenu] = useState<{x:number,y:number,id:string}|null>(null)
  const [edgeMenu, setEdgeMenu] = useState<{x:number,y:number,id:string,edge:Edge}|null>(null)
  const [editIndex, setEditIndex] = useState<number|null>(null)
  const [lostId, setLostId] = useState<string|null>(null)
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string|null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string|null>(null)
  const isInteractive = useStore((s) => s.nodesDraggable && s.nodesConnectable && s.elementsSelectable)
  const positionsRef = useRef<Record<string,{x:number,y:number}>>(storage.loadPositions())
  const zIndexRef = useRef<Record<string,number>>(storage.loadZIndex())

  useEffect(() => {
    positionsRef.current = storage.loadPositions()
    zIndexRef.current = storage.loadZIndex()
  }, [vault])

  const handleEdit = (id: string) => {
    if(!vault) return
    const rawId = id.replace(/^item-/, '')
    const idx = vault.items?.findIndex((i:any)=> String(i.id)===rawId)
    if(idx!==undefined && idx>-1) setEditIndex(idx)
  }

  const changeZ = (id:string, delta:number)=>{
    const map = { ...zIndexRef.current }
    map[id] = (map[id] || 0) + delta
    zIndexRef.current = map
    storage.saveZIndex(map)
    const updated = nodes.map(n=>{
      if(n.id!==id) return n
      const current = Number((n.style as any)?.zIndex) || 0
      return { ...n, style: { ...(n.style||{}), zIndex: current + delta } }
    })
    setGraph({ nodes: updated, edges })
  }

  const openMenu = (e: React.MouseEvent, n: Node) => {
    e.preventDefault()
    e.stopPropagation()
    if(locked.includes(n.id)) return
    if(!isInteractive){
      handleEdit(n.id)
      return
    }
    const rect = diagramRef.current?.getBoundingClientRect()
    const x = rect ? e.clientX - rect.left : e.clientX
    const y = rect ? e.clientY - rect.top : e.clientY
    setMenu({ x, y, id: n.id })
  }

  const openEdgeMenu = (e: React.MouseEvent, edge: Edge) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isInteractive) return
    const rect = diagramRef.current?.getBoundingClientRect()
    const x = rect ? e.clientX - rect.left : e.clientX
    const y = rect ? e.clientY - rect.top : e.clientY
    setEdgeMenu({ x, y, id: edge.id, edge })
    setSelectedEdgeId(edge.id)
  }

  const handleDeleteEdge = (edge: Edge) => {
    if (!confirm('Delete this connection?')) return
    if (vault) {
      const src = edge.source.replace(/^item-/, '')
      const tgt = edge.target.replace(/^item-/, '')
      if (edge.id.startsWith('edge-2fa-')) {
        removeTwofa(tgt, src)
      } else {
        removeRecovery(src, tgt)
      }
      const updated = useVault.getState().vault
      if (updated) {
        setGraph(parseVault(updated))
        storage.saveVault(JSON.stringify(updated))
      }
    } else {
      removeEdge(edge.id)
    }
    setEdgeMenu(null)
    setSelectedEdgeId(null)
  }

  useEffect(() => {
    const close = () => {
      setMenu(null)
      setEdgeMenu(null)
      setSelectedEdgeId(null)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedEdgeId) {
        e.preventDefault()
        const edge = edges.find(ed => ed.id === selectedEdgeId)
        if (edge) handleDeleteEdge(edge)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [selectedEdgeId, edges])

  // allow the user to drag nodes and keep the new coordinates in state
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const updated = applyNodeChanges(changes, nodes)
      if(isInteractive){
        const map = { ...positionsRef.current }
        changes.forEach(c=>{
          if(c.type==='position' && (c as any).position && !locked.includes(c.id)){
            map[c.id] = (c as any).position
          }
        })
        positionsRef.current = map
        storage.savePositions(map)
      }
      setGraph({ nodes: updated, edges: orientEdges(updated, edges) })
    },
    [setGraph, nodes, edges, isInteractive, locked]
  )

  const onConnect = useCallback(
    (conn: Connection) => {
      const targetNode = nodes.find(n => n.id === conn.target)
      if (!targetNode?.data?.isRecovery) {
        alert('Only recovery methods can be targets')
        return
      }

      if (vault && conn.source && conn.target) {
        const srcId = conn.source.replace(/^item-/, '')
        const tgtId = conn.target.replace(/^item-/, '')
        addRecovery(srcId, tgtId)
        const updated = useVault.getState().vault
        if (updated) setGraph(parseVault(updated))
      } else {
        // fallback to a visual edge only
        const newEdges = addEdge({ ...conn, style: { stroke: '#8b5cf6' } }, edges)
        setGraph({ nodes, edges: orientEdges(nodes, newEdges) })
      }
    },
    [nodes, edges, setGraph, vault, addRecovery]
  )

  const nodesWithLock = nodes.map(n =>
    locked.includes(n.id)
      ? { ...n, draggable: false, connectable: false, selectable: false }
      : { ...n, draggable: true, connectable: true, selectable: true }
  )

  const nodeMap = new Map(nodesWithLock.map(n => [n.id, n]))
  const isVisible = (n: Node): boolean => {
    if (hidden.includes(n.id)) return false
    let parent = n.parentNode ? nodeMap.get(n.parentNode) : null
    while (parent) {
      if (hidden.includes(parent.id)) return false
      parent = parent.parentNode ? nodeMap.get(parent.parentNode) : null
    }
    return true
  }

  const visibleNodes = nodesWithLock.filter(isVisible)
  const validNodeIds = new Set(visibleNodes.map(n => n.id))
  const visibleEdges = edges
    .filter(
      e =>
        validNodeIds.has(e.source) &&
        validNodeIds.has(e.target) &&
        !hidden.includes(e.source) &&
        !hidden.includes(e.target),
    )
    .map(e =>
      hoveredEdgeId === e.id ? { ...e, animated: true } : { ...e, animated: false }
    )

  return (
    <div ref={diagramRef} className="relative w-full h-[80vh] rounded-lg overflow-hidden border">
      <ReactFlow
        nodes={visibleNodes}
        edges={visibleEdges}
        nodeTypes={nodeTypes}
        onConnect={onConnect}
        onNodesChange={onNodesChange}
        onEdgeMouseEnter={(_, e) => setHoveredEdgeId(e.id)}
        onEdgeMouseLeave={() => setHoveredEdgeId(null)}
        onEdgeContextMenu={openEdgeMenu}
        onEdgeClick={(_, e) => setSelectedEdgeId(e.id)}
        onNodeClick={openMenu}
        onNodeContextMenu={openMenu}
        nodesDraggable={isInteractive}
        defaultEdgeOptions={{ style: { stroke: '#8b5cf6' } }}
        connectionLineStyle={{ stroke: '#8b5cf6' }}
        fitView
      >
        <Background />
        <Controls showInteractive />
      </ReactFlow>
      {/* Legend --------------------------------------------------------- */}
      <div className="absolute top-1 left-1 z-10 text-xs space-y-1">
        <div className="flex items-center gap-1 group relative">
          <div className="w-6 border-t-2 border-purple-600" />
          <QuestionMarkCircleIcon className="h-4 w-4 text-gray-600" />
          <span className="absolute left-7 top-1/2 -translate-y-1/2 bg-white border rounded px-1 shadow pointer-events-none opacity-0 group-hover:opacity-100 whitespace-nowrap">
            Recovery relationship
          </span>
        </div>
        <div className="flex items-center gap-1 group relative">
          <div className="w-6 border-t-2 border-sky-500 border-dashed" />
          <QuestionMarkCircleIcon className="h-4 w-4 text-gray-600" />
          <span className="absolute left-7 top-1/2 -translate-y-1/2 bg-white border rounded px-1 shadow pointer-events-none opacity-0 group-hover:opacity-100 whitespace-nowrap">
            2FA provider link
          </span>
        </div>
      </div>
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
          <li
            className="px-3 py-1 cursor-pointer hover:bg-gray-100"
            onClick={()=>{changeZ(menu.id,-1);setMenu(null)}}
          >
            Move Backward
          </li>
          <li
            className="px-3 py-1 cursor-pointer hover:bg-gray-100"
            onClick={()=>{changeZ(menu.id,1);setMenu(null)}}
          >
            Move Forward
          </li>
          <li
            className="px-3 py-1 cursor-pointer hover:bg-gray-100"
            onClick={()=>{
              if(lost.includes(menu.id)) clearLost(menu.id)
              else setLostId(menu.id)
              setMenu(null)
            }}
          >
          {lost.includes(menu.id) ? 'Have Access' : 'Lost Access'}
        </li>
      </ul>
      )}
      {edgeMenu && (
        <ul
          className="absolute bg-white border rounded shadow text-sm"
          style={{top:edgeMenu.y,left:edgeMenu.x}}
        >
          <li
            className="px-3 py-1 cursor-pointer hover:bg-gray-100"
            onClick={()=>handleDeleteEdge(edgeMenu.edge)}
          >
            Delete Edge
          </li>
        </ul>
      )}
      {editIndex!==null && (
        <EditItemModal index={editIndex} onClose={()=>setEditIndex(null)} />
      )}
      {lostId && (
        <LostModal id={lostId} onClose={()=>setLostId(null)} />
      )}
    </div>
  )
}

export default function VaultDiagram() {
  return (
    <ReactFlowProvider>
      <DiagramContent />
    </ReactFlowProvider>
  )
}
