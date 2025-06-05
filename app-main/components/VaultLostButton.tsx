'use client'
import { useGraph } from '@/contexts/GraphStore'
import { useLostStore } from '@/contexts/LostStore'

export default function VaultLostButton(){
  const { nodes } = useGraph()
  const { lost, markAll, clearAll } = useLostStore()

  const ids = nodes.map(n => n.id)
  const allLost = ids.length > 0 && ids.every(id => lost.includes(id))

  const toggle = () => {
    if(allLost) clearAll()
    else markAll(ids)
  }

  return (
    <button
      onClick={toggle}
      className="bg-red-600 text-white px-4 py-2 rounded self-start"
    >
      {allLost ? 'Have Access to Vault' : 'Lost Access to Vault'}
    </button>
  )
}

