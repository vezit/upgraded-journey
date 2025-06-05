'use client'
import { useGraph } from '@/contexts/GraphStore'
import { useLostStore } from '@/contexts/LostStore'

interface Props {
  id: string
  onClose: () => void
}

export default function LostModal({ id, onClose }: Props) {
  const { nodes, edges } = useGraph()
  const { markLost, clearLost, lost } = useLostStore()

  const node = nodes.find(n => n.id === id)
  if (!node) return null

  const recoveryEdges = edges.filter(e => e.target === id && e.style?.stroke === '#8b5cf6')
  const providerEdges = edges.filter(e => e.target === id && e.style?.stroke === '#0ea5e9')

  const affectedEdges = edges.filter(e => e.source === id && e.style?.stroke === '#0ea5e9')

  const recoveryNodes = recoveryEdges.map(e => nodes.find(n => n.id === e.source)).filter(Boolean)
  const providerNodes = providerEdges.map(e => nodes.find(n => n.id === e.source)).filter(Boolean)
  const affectedNodes = affectedEdges.map(e => nodes.find(n => n.id === e.target)).filter(Boolean)


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-md shadow-md max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4">Lost Access to {node.data.label}</h2>
        <p className="mb-2">These items may help you recover access:</p>
        <ul className="list-disc list-inside space-y-1 mb-4">
          {recoveryNodes.map((n: any) => (
            <li key={n.id}>{n.data.label} (recovery)</li>
          ))}
          {providerNodes.map((n: any) => (
            <li key={n.id}>{n.data.label} (2FA provider)</li>
          ))}
          {!recoveryNodes.length && !providerNodes.length && (
            <li>No linked recovery methods</li>
          )}
        </ul>

        {affectedNodes.length > 0 && (
          <div className="mb-4">
            <p className="font-medium mb-1">Affected services:</p>
            <ul className="list-disc list-inside space-y-1">
              {affectedNodes.map((n: any) => (
                <li key={n.id}>{n.data.label}</li>
              ))}
            </ul>
            <p className="mt-2 text-sm">
              Collect the 2FA recovery codes for these services and store them in
              a separate vault such as
              <a href="https://2favault.reipur.dk" className="text-indigo-600 underline ml-1">2favault.reipur.dk</a>.
            </p>
          </div>
        )}

        <button
          onClick={() => {
            if(lost.includes(id)) clearLost(id)
            else markLost(id)
            onClose()
          }}
          className="bg-red-600 text-white px-4 py-2 rounded mr-2"
        >
          {lost.includes(id) ? 'Have Access' : 'Mark as Lost'}
        </button>
        <button onClick={onClose} className="bg-gray-300 px-4 py-2 rounded">
          Close
        </button>
      </div>
    </div>
  )
}
