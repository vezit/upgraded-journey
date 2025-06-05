import UploadZone from '@/components/UploadZone'
import VaultDiagram from '@/components/VaultDiagram'
import { parseVault } from '@/lib/parseVault'
import { useGraph } from '@/contexts/GraphStore'

export default function Vault(){
  const { setGraph } = useGraph()
  return (
    <div className="p-4 flex flex-col gap-4">
      <UploadZone onLoad={data=>setGraph(parseVault(data))} />
      <VaultDiagram />
    </div>
  )
}
