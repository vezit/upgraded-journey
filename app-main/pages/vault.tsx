import UploadZone from '@/components/UploadZone'
import DeleteZone from '@/components/DeleteZone'
import VaultDiagram from '@/components/VaultDiagram'
import ExportButton from '@/components/ExportButton'
import TemplateZone from '@/components/TemplateZone'
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
      {vault ? (
        <DeleteZone />
      ) : (
        <>
          <UploadZone onLoad={handleLoad} />
          <TemplateZone onGenerate={handleLoad} />
        </>
      )}
      {vault && <ExportButton />}
      <VaultDiagram />
    </div>
  )
}