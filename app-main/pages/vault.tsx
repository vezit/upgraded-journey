import UploadZone from '@/components/UploadZone'
import VaultDiagram from '@/components/VaultDiagram'
import VaultEditor from '@/components/VaultEditor'
import ExportButton from '@/components/ExportButton'
import { parseVault } from '@/lib/parseVault'
import { saveVault } from '@/lib/storage'
import { useGraph } from '@/contexts/GraphStore'
import { useVault } from '@/contexts/VaultStore'

export default function Vault() {
  const { setGraph } = useGraph()
  const { vault, setVault } = useVault()

  const handleLoad = (data: any) => {
    setVault(data)
    setGraph(parseVault(data))
    saveVault(JSON.stringify(data))
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <UploadZone onLoad={handleLoad} />
      {vault && (
        <>
          <VaultEditor />
          <ExportButton />
        </>
      )}
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
