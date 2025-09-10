import VaultDiagram from '@/components/VaultDiagram'
import ChatInterface from '@/components/ChatInterface'
import ExportButton from '@/components/ExportButton'
import VersionHistoryModal from '@/components/VersionHistoryModal'
import VaultItemList from '@/components/VaultItemList'
import EditItemModal from '@/components/EditItemModal'
import { useState, useEffect } from 'react'
import { parseVault } from '@/lib/parseVault'
import * as storage from '@/lib/storage'
import { createTemplate } from '@/lib/sampleVault'
import { useGraph } from '@/contexts/GraphStore'
import { useVault } from '@/contexts/VaultStore'
import { useHiddenStore } from '@/contexts/HiddenStore'

export default function Vault() {
  const { setGraph } = useGraph()
  const { vault, setVault } = useVault()
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)

  const [showList, setShowList] = useState(true)
  const [showChat, setShowChat] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [shrinkGroups, setShrinkGroups] = useState(false)

  const { clear } = useHiddenStore()

  // Auto-load template if no vault exists
  useEffect(() => {
    if (!vault) {
      // Check if there's a saved vault in localStorage first
      const savedVault = storage.loadVault()
      if (savedVault) {
        setVault(savedVault)
        setGraph(parseVault(savedVault))
      } else {
        // Load template data directly
        const templateData = createTemplate()
        setVault(templateData)
        setGraph(parseVault(templateData))
        clear()
      }
    } else {
      setGraph(parseVault(vault))
    }
  }, [vault, setVault, setGraph, clear])

  return (
    <div className="p-4 flex flex-col gap-4 mx-auto px-6">
      {vault && (
        <div className="flex gap-2">
          <ExportButton />
          <button
            onClick={() => setShowHistory(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded self-start"
          >
            Version History
          </button>
          <button
            onClick={() => {
              const templateData = createTemplate()
              setVault(templateData)
              setGraph(parseVault(templateData))
              storage.saveVault(JSON.stringify(templateData))
              clear()
            }}
            className="px-4 py-2 bg-orange-600 text-white rounded self-start hover:bg-orange-700"
          >
            Reset to Sample
          </button>
          <label className="flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              checked={shrinkGroups}
              onChange={e => setShrinkGroups(e.target.checked)}
            />
            Shrink Categories
          </label>
        </div>
      )}
      <div className="flex flex-col md:flex-row gap-4">

        {vault && showList && (
          <VaultItemList
            onEdit={(i) => setEditIndex(i)}
            onClose={() => setShowList(false)}
            onCreate={() => setCreating(true)}
          />
        )}
        <VaultDiagram />
        {showChat && <ChatInterface onClose={() => setShowChat(false)} />}
      </div>
      {editIndex !== null && (
        <EditItemModal index={editIndex} onClose={() => setEditIndex(null)} />
      )}
      {creating && <EditItemModal onClose={() => setCreating(false)} />}
      {showHistory && <VersionHistoryModal onClose={() => setShowHistory(false)} />}
    </div>
  )
}