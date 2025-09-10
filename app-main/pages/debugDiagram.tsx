import { useState } from 'react'
import VaultDiagram from '@/components/VaultDiagram'
import { useVault } from '@/contexts/VaultStore'
import { useGraph } from '@/contexts/GraphStore'
import { parseVault } from '@/lib/parseVault'

export default function DebugDiagram() {
  const { vault, setVault } = useVault()
  const { setGraph } = useGraph()
  const [selected, setSelected] = useState<number | ''>('')
  const [raw, setRaw] = useState('')
  if (!vault) return <div className="p-4">No vault loaded.</div>

  const handleSelect = (val: string) => {
    if (val === '') {
      setSelected('')
      setRaw('')
      return
    }
    const i = Number(val)
    setSelected(i)
    const field = vault.items[i]?.fields?.find((f: any) => f.name === 'vaultdiagram')?.value || '{}'
    setRaw(field)
  }

  const handleSave = () => {
    const i = Number(selected)
    if (isNaN(i)) return
    const items = [...vault.items]
    const item = { ...items[i] }
    let fields = item.fields ? [...item.fields] : []
    const idx = fields.findIndex((f: any) => f.name === 'vaultdiagram')
    if (idx > -1) fields[idx] = { ...fields[idx], value: raw }
    else fields.push({ name: 'vaultdiagram', value: raw, type: 0 })
    item.fields = fields
    items[i] = item
    const updated = { ...vault, items }
    setVault(updated)
    setGraph(parseVault(updated))
  }

  return (
    <div className="flex h-screen">
      <div className="flex-1 border-r">
        <VaultDiagram />
      </div>
      <div className="w-1/3 p-4 space-y-2">
        <select
          className="border p-2 w-full"
          value={selected}
          onChange={e => handleSelect(e.target.value)}
        >
          <option value="">Select item…</option>
          {vault.items.map((it: any, i: number) => (
            <option key={it.id} value={i}>
              {it.name}
            </option>
          ))}
        </select>
        <textarea
          className="w-full h-64 border p-2 font-mono text-xs"
          value={raw}
          onChange={e => setRaw(e.target.value)}
        />
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={handleSave}
        >
          Save
        </button>
      </div>
    </div>
  )
}
