'use client'
import { useState } from 'react'
import { useVault } from '@/contexts/VaultStore'

import { useHoverStore } from '@/contexts/HoverStore'
import { EllipsisVerticalIcon } from '@heroicons/react/24/solid'

type Props = { onEdit: (index: number) => void }


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


export default function VaultItemList({ onEdit }: Props) {
  const { vault } = useVault()
  const [selected, setSelected] = useState<number[]>([])
  const { hoveredId, setHoveredId } = useHoverStore()


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

  return (
    <div className="border rounded w-full md:w-80 overflow-auto max-h-[80vh]">
      <table className="w-full table-auto border-separate border-spacing-y-1">
        <thead className="text-sm text-gray-500 sticky top-0 bg-white">
          <tr>
            <th className="px-4 text-left">
              <input type="checkbox" checked={selected.length === vault.items.length} onChange={toggleSelectAll} />
            </th>
            <th className="text-left">Name</th>
            <th className="text-left hidden lg:table-cell">Owner</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {vault.items.map((item: any, index: number) => {
            const uri = item.login?.uris?.[0]?.uri
            const domain = domainFrom(uri)
            const logo = `https://www.google.com/s2/favicons?domain=${domain || 'example.com'}`
            const owner = item.login?.username?.includes('test') ? 'test' : 'Me'
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
                    <div className="text-xs text-gray-500">{item.login?.username}</div>
                  </div>
                </td>
                <td className="hidden lg:table-cell">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${owner === 'test' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{owner}</span>
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
  )
}
