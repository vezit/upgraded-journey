'use client'
import { Handle, NodeProps, Position } from 'reactflow'
import Image from 'next/image'

export default function VaultNode({ data }: NodeProps) {
  return (
    <div className="flex flex-col items-center gap-1 p-3 rounded-2xl shadow bg-white/90 backdrop-blur max-w-[9rem]">
      <div className="relative">
        <Image
          width={40}
          height={40}
          src={data.logoUrl}
          alt={data.label}
          className="rounded-lg shrink-0"
          onError={(e) => ((e.target as HTMLImageElement).src = '/img/default.svg')}
        />
        {data.nestedLogoUrl && (
          <Image
            width={16}
            height={16}
            src={data.nestedLogoUrl}
            alt="nested"
            className="absolute bottom-0 right-0 rounded-full border bg-white"
            onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
          />
        )}
      </div>
      <span className="text-sm font-semibold text-slate-800 text-center">
        {data.label}
      </span>
      <span className="text-[11px] text-slate-500 break-all text-center">
        {data.username}
      </span>
      {data.isRecovery && (
        <span className="text-xs font-semibold text-purple-600">Recovery Node</span>
      )}

      {/* handles */}
      <Handle
        type="target"
        position={Position.Top}
        isValidConnection={() => data.isRecovery}
      />
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
