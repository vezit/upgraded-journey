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
    </div>
  )
}
