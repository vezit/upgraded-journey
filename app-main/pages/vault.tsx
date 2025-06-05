import UploadZone from '@/components/UploadZone'
import DeleteZone from '@/components/DeleteZone'
import VaultDiagram from '@/components/VaultDiagram'
import ChatInterface from '@/components/ChatInterface'
import ExportButton from '@/components/ExportButton'
import VersionHistoryModal from '@/components/VersionHistoryModal'
import TemplateZone from '@/components/TemplateZone'
import VaultItemList from '@/components/VaultItemList'
import EditItemModal from '@/components/EditItemModal'
import { useState } from 'react'
import { parseVault } from '@/lib/parseVault'
import * as storage from '@/lib/storage'
import { useGraph } from '@/contexts/GraphStore'
import { useVault } from '@/contexts/VaultStore'

export default function Vault() {
  const { setGraph } = useGraph()
  const { vault, setVault } = useVault()
  const [editIndex, setEditIndex] = useState<number | null>(null)

  const [showList, setShowList] = useState(true)
  const [showChat, setShowChat] = useState(true)
  const [showHistory, setShowHistory] = useState(false)


  const handleLoad = (data: any) => {
    setVault(data)
    setGraph(parseVault(data))
    storage.saveVault(JSON.stringify(data))
  }

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
        </div>
      )}
      <div className="flex flex-col md:flex-row gap-4">

        {vault && showList && (
          <VaultItemList
            onEdit={(i) => setEditIndex(i)}
            onClose={() => setShowList(false)}
          />
        )}
        <VaultDiagram />
        {showChat && <ChatInterface onClose={() => setShowChat(false)} />}
      </div>
      {editIndex !== null && (
        <EditItemModal index={editIndex} onClose={() => setEditIndex(null)} />
      )}
      {showHistory && (
        <VersionHistoryModal onClose={() => setShowHistory(false)} />
      )}
    </div>
  )
}