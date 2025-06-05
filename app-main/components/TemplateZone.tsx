'use client'
import { createTemplate, TemplateName } from '@/lib/sampleVault'

export default function TemplateZone({ onGenerate }:{ onGenerate:(v:any)=>void }){
  const generate = (name: TemplateName) => {
    const v = createTemplate(name)
    onGenerate(v)
  }
  return (
    <div className="border-2 border-dashed p-8 text-center flex flex-col gap-4">
      <span>Or generate a template:</span>
      <div className="flex justify-center gap-2">
        <button onClick={()=>generate('mail')} className="px-3 py-2 bg-indigo-600 text-white rounded">Mail</button>
        <button onClick={()=>generate('linkedin')} className="px-3 py-2 bg-indigo-600 text-white rounded">LinkedIn</button>
        <button onClick={()=>generate('netflix')} className="px-3 py-2 bg-indigo-600 text-white rounded">Netflix</button>
        <button onClick={()=>generate('demo')} className="px-3 py-2 bg-indigo-600 text-white rounded">Demo</button>
      </div>
    </div>
  )
}
