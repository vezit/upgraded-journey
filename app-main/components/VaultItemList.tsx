'use client'
import { useEffect, useState } from 'react'
import { useVault } from '@/contexts/VaultStore'
import { useHiddenStore } from '@/contexts/HiddenStore'

import { useHoverStore } from '@/contexts/HoverStore'
import {
  EllipsisVerticalIcon,
  PlusIcon,
} from '@heroicons/react/24/solid'

type Props = { onEdit: (index: number) => void; onClose?: () => void; onCreate?: () => void }


const domainFrom = (raw?: string) => {
  if (!raw) return undefined
  try {
    return new URL(raw).hostname.replace(/^www\./, '')
  } catch {
    try {
      return new URL(`http://${raw}`).hostname.replace(/^www\./, '')
    } catch {
      return undefined
    }
  }
}


export default function VaultItemList({ onEdit, onClose, onCreate }: Props) {
  const { vault } = useVault()
  const [selected, setSelected] = useState<number[]>([])
  const [query, setQuery] = useState('')
  const [width, setWidth] = useState(320)

  const { hoveredId, setHoveredId } = useHoverStore()
  const { hidden, hide, unhide } = useHiddenStore()

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('list-width')
      if (stored) setWidth(parseInt(stored, 10))
    }
  }, [])

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('list-width', String(width))
    }
  }, [width])


  if (!vault?.items) return null

  const toggleSelect = (idx: number) => {
    setSelected(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    )
  }

  const toggleSelectAll = () => {
    setSelected(
      selected.length === vault.items.length
        ? []
        : vault.items.map((_: unknown, i: number) => i)
    )
  }

  const toggleHideSelected = () => {
    if (!vault?.items) return
    const ids = selected.map(i => `item-${vault.items[i].id}`)
    const shouldHide = ids.some(id => !hidden.includes(id))
    if (shouldHide) hide(ids)
    else unhide(ids)
    setSelected([])
  }

  // sort indexes so recovery methods appear first in the list
  const orderedIndexes = vault.items
    .map((item: any, idx: number) => ({ item, idx }))
    .sort((a: { item: any; idx: number }, b: { item: any; idx: number }) => {
      const aRec = a.item.fields?.some(
        (f: any) => f.name === 'recovery_node' && String(f.value).toLowerCase() === 'true',
      )
      const bRec = b.item.fields?.some(
        (f: any) => f.name === 'recovery_node' && String(f.value).toLowerCase() === 'true',
      )
      if (aRec === bRec) return 0
      return aRec ? -1 : 1
    })
    .map((o: { item: any; idx: number }) => o.idx)

  const startResize = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = width
    const onMove = (ev: MouseEvent) => {
      const newWidth = startWidth + ev.clientX - startX
      setWidth(Math.max(200, Math.min(newWidth, 600)))
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  return (
    <div style={{ width }} className="relative">
      <div className="border rounded overflow-auto max-h-[80vh] h-full">

      {(onClose || onCreate) && (
        <div className="flex justify-between items-center p-1">
          {onClose && (
            <button
              onClick={onClose}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          )}
          {onCreate && (
            <button
              onClick={onCreate}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <PlusIcon className="h-4 w-4" />
              New
            </button>
          )}
        </div>
      )}

      <div className="p-1 sticky top-0 bg-white z-10">
        <input
          type="text"
          placeholder="Search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full border px-2 py-1 rounded text-sm"
        />
      </div>


      <table className="w-full table-auto border-separate border-spacing-y-1">
        <thead className="text-sm text-gray-500 sticky top-0 bg-white">
          <tr>
            <th className="px-4 text-left">
              <input type="checkbox" checked={selected.length === vault.items.length} onChange={toggleSelectAll} />
            </th>
            <th className="text-left">
              <div className="flex items-center gap-1">
                <span>Name</span>
                <button
                  onClick={toggleHideSelected}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  {selected.every(i => hidden.includes(`item-${vault.items[i].id}`)) ? 'Unhide' : 'Hide'}
                </button>
              </div>
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {vault.items
            .filter((item: any) => !hidden.includes(`item-${item.id}`))
            .filter((item: any) =>
              item.name?.toLowerCase().includes(query.toLowerCase())
            )

            .map((item: any, index: number) => {

            const uri = item.login?.uris?.[0]?.uri
            const domain = domainFrom(uri)
            const logo = `https://www.google.com/s2/favicons?domain=${domain || 'example.com'}`
            const isRecovery = item.fields?.some(
              (f: any) => f.name === 'recovery_node' && String(f.value).toLowerCase() === 'true'
            )

            const rowId = `item-${item.id}`
            const highlighted = hoveredId === rowId

            return (
              <tr
                key={item.id}
                className={`bg-white hover:bg-gray-50 border-t cursor-pointer ${highlighted ? 'bg-indigo-50' : ''}`}
                onClick={() => onEdit(index)}
                onMouseEnter={() => setHoveredId(rowId)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(index)}
                    onChange={e => {
                      e.stopPropagation()
                      toggleSelect(index)
                    }}
                  />
                </td>
                <td className="flex items-center gap-3 py-3 px-4">
                  <img
                    src={logo}
                    alt=""
                    className="w-5 h-5"
                    onError={e => { (e.currentTarget as HTMLImageElement).src = '/img/default.svg' }}
                  />
                  <div>
                    <div className="font-medium text-sm text-gray-800">{item.name}</div>
                    {isRecovery && (
                      <span className="text-xs font-semibold text-purple-600">Recovery Node</span>
                    )}
                  </div>
                </td>
                <td className="text-right px-4">
                  <EllipsisVerticalIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      </div>
      <div
        onMouseDown={startResize}
        className="absolute top-0 right-0 h-full w-1 cursor-col-resize bg-transparent"
      />
    </div>
  )
}
