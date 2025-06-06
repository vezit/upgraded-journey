'use client'
import { useEffect, useState } from 'react'
import { useVault } from '@/contexts/VaultStore'
import { useHiddenStore } from '@/contexts/HiddenStore'

import { useHoverStore } from '@/contexts/HoverStore'
import { useLockedStore } from '@/contexts/LockedStore'
import { useLostStore } from '@/contexts/LostStore'
import {
  EllipsisVerticalIcon,
  EyeIcon,
  EyeSlashIcon,
  PlusIcon,
  LockClosedIcon,
  LockOpenIcon,
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
  const [vaultMenu, setVaultMenu] = useState<string | null>(null)

  const { hoveredId, setHoveredId } = useHoverStore()
  const { hidden, hide, unhide } = useHiddenStore()
  const { locked, lock, unlock } = useLockedStore()
  const { lost, markLost, clearLost, markAll } = useLostStore()

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

  const toggleHideSelected = async () => {
    if (!items.length) return
    const ids = selected.map(i => `item-${items[i].id}`)
    const shouldHide = ids.some(id => !hidden.includes(id))
    if (shouldHide) await hide(ids)
    else await unhide(ids)
    setSelected([])
  }

  const toggleVisibility = async (id: string) => {
    if (hidden.includes(id)) await unhide([id])
    else await hide([id])
  }

  const toggleLock = (id: string) => {
    if (locked.includes(id)) unlock([id])
    else lock([id])
  }

  const idsForVault = (name: string) =>
    items.filter((it: any) => (it.vault || 'None') === name).map((it: any) => `item-${it.id}`)

  const toggleVaultVisibility = async (name: string) => {
    const ids = idsForVault(name)
    if (!ids.length) return
    const shouldHide = ids.some(id => !hidden.includes(id))
    if (shouldHide) await hide(ids)
    else await unhide(ids)
  }

  const toggleVaultLock = (name: string) => {
    const ids = idsForVault(name)
    if (!ids.length) return
    const shouldLock = ids.some(id => !locked.includes(id))
    if (shouldLock) lock(ids)
    else unlock(ids)
  }

  const toggleVaultLost = (name: string) => {
    const ids = idsForVault(name)
    if (!ids.length) return
    const allLost = ids.every(id => lost.includes(id))
    if (allLost) ids.forEach(id => clearLost(id))
    else markAll(ids)
  }

  // sort indexes so recovery methods appear first in the list
  const orderedIndexes = items
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
          {(() => {
            const groups: Record<string, { item: any; index: number }[]> = {}
            items.forEach((it: any, idx: number) => {
              const name = it.vault || 'None'
              if (!groups[name]) groups[name] = []
              groups[name].push({ item: it, index: idx })
            })
            const order = (vault.vaults || []) as string[]
            const names = [...order.filter(n => groups[n]), ...Object.keys(groups).filter(n => !order.includes(n))]
            return names.map(name => {
              const groupItems = groups[name].filter(({ item }) =>
                item.name?.toLowerCase().includes(query.toLowerCase())
              )
              if (!groupItems.length) return null
              const ids = groupItems.map(({ item }) => `item-${item.id}`)
              const allHidden = ids.every(id => hidden.includes(id))
              const allLocked = ids.every(id => locked.includes(id))
              const allLost = ids.every(id => lost.includes(id))
              return (
                <>
                  <tr key={`vault-${name}`} className="bg-gray-100">
                    <td colSpan={3} className="px-4 py-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-700">{name}</span>
                        <div className="flex items-center">
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              toggleVaultVisibility(name)
                            }}
                            className="mr-2"
                          >
                            {allHidden ? (
                              <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                            ) : (
                              <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                            )}
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              toggleVaultLock(name)
                            }}
                            className="mr-2"
                          >
                            {allLocked ? (
                              <LockClosedIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                            ) : (
                              <LockOpenIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                            )}
                          </button>
                          <div className="relative inline-block">
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                setVaultMenu(vaultMenu === name ? null : name)
                              }}
                            >
                              <EllipsisVerticalIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                            </button>
                            {vaultMenu === name && (
                              <ul className="absolute right-0 bg-white border rounded shadow text-sm">
                                <li
                                  className="px-3 py-1 cursor-pointer hover:bg-gray-100"
                                  onClick={() => {
                                    toggleVaultLost(name)
                                    setVaultMenu(null)
                                  }}
                                >
                                  {allLost ? 'Have Access' : 'Lost Access'}
                                </li>
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                  {groupItems.map(({ item, index }) => {
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
                          <EllipsisVerticalIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 inline" />
                        </td>
                      </tr>
                    )
                  })}
                </>
              )
            })
          })()}
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
