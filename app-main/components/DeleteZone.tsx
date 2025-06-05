'use client'
import { useGraph } from '@/contexts/GraphStore'
import { useVault } from '@/contexts/VaultStore'
import * as storage from '@/lib/storage'

export default function DeleteZone(){
  const { setGraph } = useGraph()
  const { setVault } = useVault()
  const onDelete = () => {
    if(confirm('Delete uploaded vault data?')){
      storage.clearVault()
      storage.clearHistory()
      setVault(null)
      setGraph({ nodes: [], edges: [] })
    }
  }
  return (
    <div className="border-2 border-dashed p-8 text-center">
      <button
        onClick={onDelete}
        className="bg-red-500 text-white px-4 py-2 rounded"
      >
        Delete Uploaded Data
      </button>
    </div>
  )
}
