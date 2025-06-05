'use client'
import { useEffect, useState } from 'react'
import { useVault } from '@/contexts/VaultStore'
import { useGraph } from '@/contexts/GraphStore'
import { parseVault } from '@/lib/parseVault'
import * as storage from '@/lib/storage'

interface Entry { timestamp: number; data: string }

export default function VersionHistoryModal({ onClose }: { onClose: () => void }) {
  const [history, setHistory] = useState<Entry[]>([])
  const { setVault } = useVault()
  const { setGraph } = useGraph()

  useEffect(() => {
    setHistory(storage.loadHistory().slice().reverse())
  }, [])

  const loadVersion = (entry: Entry) => {
    try {
      const data = JSON.parse(entry.data)
      setVault(data)
      setGraph(parseVault(data))
      storage.saveVault(entry.data)
      onClose()
    } catch {
      alert('Failed to load version')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-md shadow-md w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-semibold mb-4">Version History</h2>
        <ul className="space-y-2 max-h-80 overflow-y-auto">
          {history.map((h, idx) => (
            <li key={idx} className="flex justify-between items-center border-b pb-1">
              <span>{new Date(h.timestamp).toLocaleString()}</span>
              <button className="text-indigo-600 underline" onClick={() => loadVersion(h)}>Load</button>
            </li>
          ))}
          {history.length === 0 && <li>No versions stored.</li>}
        </ul>
        <div className="text-right mt-4">
          <button onClick={onClose} className="px-3 py-2 bg-gray-200 rounded">Close</button>
        </div>
      </div>
    </div>
  )
}
