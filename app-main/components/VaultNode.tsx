'use client'
import { Handle, NodeProps, Position } from 'reactflow'

import { useHoverStore } from '@/contexts/HoverStore'
import { useLostStore } from '@/contexts/LostStore'
import { useLockedStore } from '@/contexts/LockedStore'
import { getGenericIconById } from '@/lib/genericIcons'

export default function VaultNode({ id, data }: NodeProps) {
  const { hoveredId, setHoveredId } = useHoverStore()
  const { lost } = useLostStore()
  const { locked } = useLockedStore()
  const highlighted = hoveredId === id
  const isLost = lost.includes(id)
  const isLocked = locked.includes(id)
  return (
    <div
      className={`flex flex-col items-center gap-1 p-3 rounded-2xl shadow bg-white/90 backdrop-blur max-w-[9rem] ${highlighted ? 'ring-2 ring-indigo-500' : ''} ${isLost ? 'border-2 border-red-500 opacity-60' : ''} ${isLocked ? 'opacity-60' : ''}`}
      onMouseEnter={() => setHoveredId(id)}
      onMouseLeave={() => setHoveredId(null)}
    >
      <div className="relative">
        {(() => {
          const genericIcon = data.genericIconId ? getGenericIconById(data.genericIconId) : null
          if (genericIcon) {
            return (
              <div 
                className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg text-gray-600 shrink-0"
                dangerouslySetInnerHTML={{ __html: genericIcon.svg }}
                title={genericIcon.description}
              />
            )
          } else {
            return (
              <img
                width={40}
                height={40}
                src={data.logoUrl}
                alt={data.label}
                className="rounded-lg shrink-0"
                onError={(e) => ((e.target as HTMLImageElement).src = '/img/default.svg')}
                loading="lazy"
              />
            )
          }
        })()}
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
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
