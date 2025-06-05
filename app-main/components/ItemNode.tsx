'use client'
import { NodeProps, Handle, Position } from 'reactflow'
import { useState } from 'react'
import { useGraph } from '@/contexts/GraphStore'

export default function ItemNode({ id, data }: NodeProps<any>) {
  const [open, setOpen] = useState(false)
  const { updateNodeData } = useGraph()
  const [name, setName] = useState(data.item.name)
  const [username, setUsername] = useState(data.item.login?.username || '')

  const onSave = () => {
    updateNodeData(id, {
      item: { ...data.item, name, login: { ...data.item.login, username } },
      label: name,
    })
    setOpen(false)
  }

  return (
    <div className="bg-white rounded shadow p-2 min-w-[150px]">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1">
          <div className="font-semibold text-sm">{name}</div>
          <div className="text-xs text-gray-500">{username}</div>
        </div>
        <button onClick={() => setOpen((o) => !o)} className="text-xs">⋮</button>
      </div>
      {open && (
        <div className="mt-2 space-y-1">
          <input
            className="border px-1 text-xs w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
          />
          <input
            className="border px-1 text-xs w-full"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
          />
          <button
            onClick={onSave}
            className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded"
          >
            Save
          </button>
        </div>
      )}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
