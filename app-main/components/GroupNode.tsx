'use client'
import { NodeProps } from 'reactflow'
import { NodeResizer } from '@reactflow/node-resizer'
import '@reactflow/node-resizer/dist/style.css'

export default function GroupNode({ data, selected }: NodeProps) {
  return (
    <div className="relative w-full h-full rounded-lg border border-dashed border-slate-400 bg-slate-50 p-2 cursor-move">
      <NodeResizer color="#4f46e5" isVisible={selected} minWidth={100} minHeight={80} />
      <span className="text-xs font-semibold text-slate-700">{data.label}</span>
    </div>
  )
}
