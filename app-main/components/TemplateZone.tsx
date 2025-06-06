'use client'
import { createTemplate } from '@/lib/sampleVault'

export default function TemplateZone({ onGenerate }:{ onGenerate:(v:any)=>void }){
  const generate = () => {
    const v = createTemplate()
    onGenerate(v)
  }
  return (
    <div className="border-2 border-dashed p-8 text-center flex flex-col gap-4">
      <span>Or generate a template:</span>
      <div className="flex justify-center gap-2">
        <button onClick={generate} className="px-3 py-2 bg-indigo-600 text-white rounded">vault.reipur.dk</button>
      </div>
    </div>
  )
}
