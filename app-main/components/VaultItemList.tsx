'use client'
import React, { useEffect, useState } from 'react'
import { useVault } from '@/contexts/VaultStore'
import { useHiddenStore } from '@/contexts/HiddenStore'

import { useHoverStore } from '@/contexts/HoverStore'
import { useLockedStore } from '@/contexts/LockedStore'
import {
  EyeIcon,
  EyeSlashIcon,
  PlusIcon,
  LockClosedIcon,
  LockOpenIcon,
} from '@heroicons/react/24/solid'

type Props = { onEdit: (index: number) => void; onClose?: () => void; onCreate?: () => void; onRemove?: (itemId: string) => void; onRemoveSelected?: (selectedIds: string[]) => void; onClearAll?: () => void }


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

const logoFor = (domain?: string) =>
  domain ? `https://${domain}/favicon.ico` : '/img/default.svg'


export default function VaultItemList({ onEdit, onClose, onCreate, onRemove, onRemoveSelected, onClearAll }: Props) {
  const { vault } = useVault()
  const [selected, setSelected] = useState<number[]>([])
  const [query, setQuery] = useState('')
  const [width, setWidth] = useState(320)

  const { hoveredId, setHoveredId } = useHoverStore()
  const { hidden, hide, unhide } = useHiddenStore()
  const { locked, lock, unlock } = useLockedStore()

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


  if (!vault) return null

  const items = vault.items || []

  const toggleSelect = (idx: number) => {
    setSelected(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    )
  }

  const toggleSelectAll = () => {
    setSelected(
      selected.length === items.length
        ? []
        : items.map((_: unknown, i: number) => i)
    )
  }

  const toggleHideSelected = () => {
    if (!items.length) return
    const ids = selected.map(i => `item-${items[i].id}`)
    const shouldHide = ids.some((id: string) => !hidden.includes(id))
    if (shouldHide) hide(ids)
    else unhide(ids)
    setSelected([])
  }

  const toggleVisibility = (id: string) => {
    if (hidden.includes(id)) unhide([id])
    else hide([id])
  }

  const toggleLock = (id: string) => {
    if (locked.includes(id)) unlock([id])
    else lock([id])
  }

  // sort indexes so recovery methods appear first in the list
  const orderedIndexes = items
    .map((item: any, idx: number) => ({ item, idx }))
    .sort((a: { item: any; idx: number }, b: { item: any; idx: number }) => {
      const getRec = (it: any) => {
        const fld = it.fields?.find((f: any) => f.name === 'vaultdiagram')?.value
        if (!fld) return false
        try {
          return !!JSON.parse(fld).recoveryNode
        } catch {
          return false
        }
      }
      const aRec = getRec(a.item)
      const bRec = getRec(b.item)
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
          className="w-full border px-2 py-1 rounded text-sm mb-2"
        />
        
        {(onRemoveSelected || onClearAll) && (
          <div className="flex gap-2 mb-2">
            {onRemoveSelected && selected.length > 0 && (
              <button
                onClick={() => {
                  const selectedIds = selected.map(i => items[i].id)
                  onRemoveSelected(selectedIds)
                  setSelected([])
                }}
                className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Delete Selected ({selected.length})
              </button>
            )}
            {onClearAll && items.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to remove all services from your vault?')) {
                    onClearAll()
                    setSelected([])
                  }
                }}
                className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        )}
      </div>


      <table className="w-full table-auto border-separate border-spacing-y-1">
        <thead className="text-sm text-gray-500 sticky top-0 bg-white">
          <tr>
            <th className="px-4 text-left">
              <input type="checkbox" checked={selected.length === items.length} onChange={toggleSelectAll} />
            </th>
            <th className="text-left">
              <div className="flex items-center gap-1">
                <span>Name</span>
                <button
                  onClick={toggleHideSelected}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  {selected.every(i => hidden.includes(`item-${items[i].id}`)) ? 'Unhide' : 'Hide'}
                </button>
              </div>
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {orderedIndexes
            .filter((idx: number) =>
              items[idx].name?.toLowerCase().includes(query.toLowerCase())
            )
            .map((index: number) => {
              const item = items[index]
              const uri = item.login?.uris?.[0]?.uri
              const domain = domainFrom(uri)
              const vdRaw = item.fields?.find((f: any) => f.name === 'vaultdiagram')?.value
              let vd: any = {}
              try { vd = vdRaw ? JSON.parse(vdRaw) : {} } catch {}
              const customLogo = vd.logoUrl
              const logo = customLogo || logoFor(domain)
              const isRecovery = !!vd.recoveryNode
              const rowId = `item-${item.id}`
              const highlighted = hoveredId === rowId
              return (
                <tr
                  key={item.id}
                  className={`bg-white hover:bg-gray-50 border-t cursor-pointer ${
                    highlighted ? 'bg-indigo-50' : ''
                  } ${hidden.includes(rowId) ? 'opacity-50' : ''}`}
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
                      onError={e => {
                        (e.currentTarget as HTMLImageElement).src = '/img/default.svg'
                      }}
                    />
                    <div>
                      <div className="font-medium text-sm text-gray-800">{item.name}</div>
                      {isRecovery && (
                        <span className="text-xs font-semibold text-purple-600">Recovery Node</span>
                      )}
                    </div>
                  </td>
                  <td className="text-right px-4">
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        toggleVisibility(rowId)
                      }}
                      className="mr-2"
                    >
                      {hidden.includes(rowId) ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        toggleLock(rowId)
                      }}
                      className="mr-2"
                    >
                      {locked.includes(rowId) ? (
                        <LockClosedIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <LockOpenIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                    {onRemove && (
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          onRemove(item.id)
                        }}
                        className="ml-1 px-2 py-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded border border-red-200 hover:border-red-300 transition-colors text-xs font-medium"
                        title="Remove from vault"
                      >
                        Remove
                      </button>
                    )}
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
