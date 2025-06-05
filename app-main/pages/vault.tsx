import UploadZone from '@/components/UploadZone'
import DeleteZone from '@/components/DeleteZone'
import VaultDiagram from '@/components/VaultDiagram'
import ChatInterface from '@/components/ChatInterface'
import ExportButton from '@/components/ExportButton'
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

  const handleLoad = (data: any) => {
    setVault(data)
    setGraph(parseVault(data))
    storage.saveVault(JSON.stringify(data))
  }

  return (
    <div className="p-4 flex flex-col gap-4 mx-auto max-w-7xl px-6">
      {vault ? (
        <DeleteZone />
      ) : (
        <>
          <UploadZone onLoad={handleLoad} />
          <TemplateZone onGenerate={handleLoad} />
        </>
      )}
      {vault && <ExportButton />}
      <div className="flex flex-col md:flex-row gap-4">
        {vault && (
          <VaultItemList onEdit={(i) => setEditIndex(i)} />
        )}
        <VaultDiagram />
        <ChatInterface />
      </div>
      {editIndex !== null && (
        <EditItemModal index={editIndex} onClose={() => setEditIndex(null)} />
      )}
    </div>
  )
}