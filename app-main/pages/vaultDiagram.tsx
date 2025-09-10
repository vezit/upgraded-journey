import VaultDiagram from '@/components/VaultDiagram'
import ChatInterface from '@/components/ChatInterface'
import ExportButton from '@/components/ExportButton'
import VaultItemList from '@/components/VaultItemList'
import EditItemModal from '@/components/EditItemModal'
import { useState, useEffect } from 'react'
import { parseVault } from '@/lib/parseVault'
import * as storage from '@/lib/storage'
import { useGraph } from '@/contexts/GraphStore'
import { useVault } from '@/contexts/VaultStore'
import { useRouter } from 'next/router'

export default function Vault() {
  const { setGraph } = useGraph()
  const { vault, setVault } = useVault()
  const router = useRouter()
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)

  const [showList, setShowList] = useState(true)
  const [showChat, setShowChat] = useState(true)
  const [shrinkGroups, setShrinkGroups] = useState(false)

  // Redirect to onboarding if no vault exists
  useEffect(() => {
    // Clean up legacy version history data
    storage.cleanupLegacyHistory()
    
    if (!vault) {
      const savedVault = storage.loadVault()
      if (savedVault) {
        setVault(savedVault)
        setGraph(parseVault(savedVault))
      } else {
        router.push('/vaultOnboarding')
      }
    } else {
      setGraph(parseVault(vault))
    }
  }, [vault, setVault, setGraph, router])

  return (
    <div className="p-4 flex flex-col gap-4 mx-auto px-6">
      {vault && (
        <div className="flex gap-2">
          <ExportButton />
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