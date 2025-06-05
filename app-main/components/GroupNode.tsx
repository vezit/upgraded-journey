'use client'
import { NodeProps } from 'reactflow'

export default function GroupNode({ data }: NodeProps) {
  return (
    <div className="w-full h-full rounded-lg border border-dashed border-slate-400 bg-slate-50 p-2">
      <span className="text-xs font-semibold text-slate-700">{data.label}</span>
    </div>
  )
}
