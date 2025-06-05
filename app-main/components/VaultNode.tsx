// components/VaultNode.tsx
'use client'
import { Handle, Position, NodeProps } from 'reactflow'
import Image from 'next/image'

export default function VaultNode({ data }: NodeProps) {
  return (
    <div className="flex flex-col items-center gap-1 p-3 rounded-2xl shadow bg-white/90 backdrop-blur">
      <Image
        src={data.logoUrl}
        alt={data.label}
        width={36}
        height={36}
        className="rounded-full"
        onError={(e) => {
          // fallback to a generic icon
          (e.target as HTMLImageElement).src = '/img/default.svg'
        }}
      />
      <span className="text-xs text-slate-700 font-medium text-center max-w-[6rem]">
        {data.label}
      </span>

      {/* React-Flow connection handles */}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
