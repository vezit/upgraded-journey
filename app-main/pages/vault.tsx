import UploadZone from '@/components/UploadZone'
import VaultDiagram from '@/components/VaultDiagram'
import { parseVault } from '@/lib/parseVault'
import { clearVault } from '@/lib/storage'
import { useGraph } from '@/contexts/GraphStore'

export default function Vault(){
  const { setGraph } = useGraph()
  return (
    <div className="p-4 flex flex-col gap-4">
      <UploadZone onLoad={data=>setGraph(parseVault(data))} />
      <VaultDiagram />
      <button
        onClick={() => {
          clearVault()
          setGraph({ nodes: [], edges: [] })
        }}
        className="self-start px-4 py-2 bg-red-500 text-white rounded"
      >
        Delete Vault Data
      </button>
    </div>
  )
}
