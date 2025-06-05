'use client'
import { Handle, NodeProps, Position } from 'reactflow'
import Image from 'next/image'

export default function VaultNode({ data }: NodeProps) {
  return (
    <div className="flex flex-col items-center gap-1 p-3 rounded-2xl shadow bg-white/90 backdrop-blur max-w-[9rem]">
      <Image
        width={40}
        height={40}
        src={data.logoUrl}
        alt={data.label}
        className="rounded-lg shrink-0"
        onError={(e) => ((e.target as HTMLImageElement).src = '/img/default.svg')}
      />
      <span className="text-sm font-semibold text-slate-800 text-center">
        {data.label}
      </span>
      <span className="text-[11px] text-slate-500 break-all text-center">
        {data.username}
      </span>

      {/* handles */}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
