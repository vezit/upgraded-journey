'use client'
import { Handle, NodeProps, Position } from 'reactflow'

import { useHoverStore } from '@/contexts/HoverStore'

export default function VaultNode({ id, data }: NodeProps) {
  const { hoveredId, setHoveredId } = useHoverStore()
  const highlighted = hoveredId === id
  return (
    <div
      className={`flex flex-col items-center gap-1 p-3 rounded-2xl shadow bg-white/90 backdrop-blur max-w-[9rem] ${highlighted ? 'ring-2 ring-indigo-500' : ''}`}
      onMouseEnter={() => setHoveredId(id)}
      onMouseLeave={() => setHoveredId(null)}
    >
      <div className="relative">
        <img
          width={40}
          height={40}
          src={data.logoUrl}
          alt={data.label}
          className="rounded-lg shrink-0"
          onError={(e) => ((e.target as HTMLImageElement).src = '/img/default.svg')}
          loading="lazy"
        />
        {data.nestedLogoUrl && (
          <img
            width={16}
            height={16}
            src={data.nestedLogoUrl}
            alt="nested"
            className="absolute bottom-0 right-0 rounded-full border bg-white"
            onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
            loading="lazy"
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
      {data.has2fa && (
        <span className="text-xs font-semibold text-sky-600">2FA Enabled</span>
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
