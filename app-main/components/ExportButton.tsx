'use client'
import { useVault } from '@/contexts/VaultStore'
import { saveVault } from '@/lib/storage'

export default function ExportButton() {
  const { vault } = useVault()
  if (!vault) return null

  const onExport = () => {
    const json = JSON.stringify(vault, null, 2)
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
      <button
        onClick={onExport}
        className="px-4 py-2 bg-indigo-600 text-white rounded self-start"
      >
        Export Vault
      </button>
    </div>
  )
}
