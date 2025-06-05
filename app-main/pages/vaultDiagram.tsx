import UploadZone from '@/components/UploadZone'
import DeleteZone from '@/components/DeleteZone'
import VaultDiagram from '@/components/VaultDiagram'
import ChatInterface from '@/components/ChatInterface'
import ExportButton from '@/components/ExportButton'
import VersionHistoryModal from '@/components/VersionHistoryModal'
import TemplateZone from '@/components/TemplateZone'
import VaultItemList from '@/components/VaultItemList'
import EditItemModal from '@/components/EditItemModal'
import { useState, useEffect } from 'react'
import { parseVault } from '@/lib/parseVault'
import * as storage from '@/lib/storage'
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

  const handleLoad = (data: any) => {
    setVault(data)
    setGraph(parseVault(data, shrinkGroups))
    clear()
    storage.saveVault(JSON.stringify(data))
  }

  useEffect(() => {
    if (vault) {
      setGraph(parseVault(vault, shrinkGroups))
    }
  }, [shrinkGroups])

  return (
    <div className="p-4 flex flex-col gap-4 mx-auto px-6">
      {vault ? (
        <DeleteZone />
      ) : (
        <>
          <UploadZone onLoad={handleLoad} />
          <TemplateZone onGenerate={handleLoad} />
        </>
      )}
      {vault && (
        <div className="flex gap-2">
          <ExportButton />
          <button
            onClick={() => setShowHistory(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded self-start"
          >
            Version History
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
    </div>
  )
}