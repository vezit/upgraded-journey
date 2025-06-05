import UploadZone from '@/components/UploadZone'
import VaultDiagram from '@/components/VaultDiagram'
import ExportButton from '@/components/ExportButton'
import { parseVault } from '@/lib/parseVault'
import * as storage from '@/lib/storage'
import { useGraph } from '@/contexts/GraphStore'
import { useVault } from '@/contexts/VaultStore'

export default function Vault() {
  const { setGraph } = useGraph()
  const { vault, setVault } = useVault()

  const handleLoad = (data: any) => {
    setVault(data)
    setGraph(parseVault(data))
    storage.saveVault(JSON.stringify(data))
  }

  return (
    <div className="p-4 flex flex-col gap-4 mx-auto max-w-7xl px-6">
      <UploadZone onLoad={handleLoad} />
      {vault && <ExportButton />}
      <VaultDiagram />
      <button
        onClick={() => {
          storage.clearVault()
          setGraph({ nodes: [], edges: [] })
        }}
        className="self-start px-4 py-2 bg-red-500 text-white rounded"
      >
        Delete Vault Data
      </button>
    </div>
  )
}