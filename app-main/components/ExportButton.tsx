'use client'
import { useState } from 'react'
import { useVault } from '@/contexts/VaultStore'
import { saveVault } from '@/lib/storage'
import { filterVaultByName, VaultName } from '@/lib/filterVault'

export default function ExportButton() {
  const { vault } = useVault()
  const [selected, setSelected] = useState<VaultName>('My Vault')
  if (!vault) return null

  const onExport = () => {
    const filtered = filterVaultByName(vault, selected)
    const json = JSON.stringify(filtered, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bitwarden-export.json'
    a.click()
    URL.revokeObjectURL(url)
    saveVault(json)
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div>
        <label className="mr-2">Export</label>
        <select
          value={selected}
          onChange={e => setSelected(e.target.value as VaultName)}
          className="border px-2 py-1"
        >
          <option value="My Vault">My Vault</option>
          <option value="Family">Family</option>
          <option value="2favault">2favault</option>
        </select>
      </div>
      <button
        onClick={onExport}
        className="px-4 py-2 bg-indigo-600 text-white rounded self-start"
      >
        Export Vault
      </button>
    </div>
  )
}
