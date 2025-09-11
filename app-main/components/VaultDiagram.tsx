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
  const { lost, clearLost } = useLostStore()
  const { vault } = useVault()
  const diagramRef = useRef<HTMLDivElement>(null)
  const [menu, setMenu] = useState<{x:number,y:number,id:string}|null>(null)
  const [edgeMenu, setEdgeMenu] = useState<{x:number,y:number,id:string,edge:Edge}|null>(null)
  const [editIndex, setEditIndex] = useState<number|null>(null)
  const [lostId, setLostId] = useState<string|null>(null)
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string|null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string|null>(null)
  const isInteractive = useStore((s) => s.nodesDraggable && s.nodesConnectable && s.elementsSelectable)
  const zIndexRef = useRef<Record<string,number>>(storage.loadZIndex())

  useEffect(() => {
    // migrate legacy positions from localStorage into vault data
    try {
      const raw = localStorage.getItem('vault-positions')
      if (raw && vault) {
        const map = JSON.parse(raw)
        const items = [...vault.items]
        let dirty = false
        items.forEach(it => {
          const id = `item-${it.id}`
          const pos = map[id]
          if (pos) {
            let fields = it.fields ? [...it.fields] : []
            const idx = fields.findIndex((f: any) => f.name === 'vaultdiagram')
            let diag: any = {}
            if (idx > -1) {
              try { diag = JSON.parse(fields[idx].value) } catch {}
            }
            diag.position = pos
            const value = JSON.stringify(diag)
            if (idx > -1) fields[idx] = { ...fields[idx], value }
            else fields.push({ name: 'vaultdiagram', value, type: 0 })
            it.fields = fields
            dirty = true
          }
        })
        if (dirty) {
          const updated = { ...vault, items }
          useVault.getState().setVault(updated)
          storage.saveVault(JSON.stringify(updated))
        }
        localStorage.removeItem('vault-positions')
      }
    } catch {}
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
    removeEdge(edge.id)
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

  // allow the user to drag nodes and persist coordinates in vault data
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const updated = applyNodeChanges(changes, nodes)
      if (isInteractive) {
        const v = useVault.getState().vault
        if (v) {
          const items = [...v.items]
          let dirty = false
          changes.forEach(c => {
            if (c.type === 'position' && (c as any).position && !locked.includes(c.id)) {
              const rawId = c.id.replace(/^item-/, '')
              const idx = items.findIndex((i: any) => String(i.id) === rawId)
              if (idx !== -1) {
                const item = { ...items[idx] }
                let fields = item.fields ? [...item.fields] : []
                const fIdx = fields.findIndex((f: any) => f.name === 'vaultdiagram')
                let diag: any = {}
                if (fIdx > -1) {
                  try { diag = JSON.parse(fields[fIdx].value) } catch {}
                }
                diag.position = (c as any).position
                const value = JSON.stringify(diag)
                if (fIdx > -1) fields[fIdx] = { ...fields[fIdx], value }
                else fields.push({ name: 'vaultdiagram', value, type: 0 })
                item.fields = fields
                items[idx] = item
                dirty = true
              }
            }
          })
          if (dirty) {
            const updatedVault = { ...v, items }
            useVault.getState().setVault(updatedVault)
            storage.saveVault(JSON.stringify(updatedVault))
          }
        }
      }
      setGraph({ nodes: updated, edges: orientEdges(updated, edges) })
    },
    [setGraph, nodes, edges, isInteractive, locked]
  )

  const onConnect = useCallback(
    (conn: Connection) => {
      const newEdges = addEdge({ ...conn, style: { stroke: '#8b5cf6' } }, edges)
      setGraph({ nodes, edges: orientEdges(nodes, newEdges) })
    },
    [nodes, edges, setGraph]
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
