import { useSessionContext } from '@supabase/auth-helpers-react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useState } from 'react'
import currency from 'currency.js'

export default function InvoicePage(){
  const { session } = useSessionContext()
  const { register, control, handleSubmit, watch } = useForm({
    defaultValues:{
      number: Date.now().toString().slice(-6),
      date: new Date().toISOString().substring(0,10),
      customer:{
        name:'Victor Reipur',
        address:'Vinkelvej 12D, 3tv',
        zip:'2800', city:'Kongens Lyngby', country:'Danmark',
      },
      items:[
        { name:'Ubiquiti UCG-Max Cloud Gateway Max', qty:1, total:2405 },
        { name:'Ubiquiti UniFi Protect G5', qty:1, total:1177 },
        { name:'PostNord levering', qty:1, total:50 },
      ]
    }
  })
  const { fields, append, remove } = useFieldArray({ control, name:'items' })
  const [pdfUrl,setPdfUrl] = useState<string>()

  const values = watch()
  const subtotal = values.items.reduce((s:any,i:any)=>s+Number(i.total),0)
  const vat      = currency(subtotal).multiply(0.25).value
  const total    = currency(subtotal).add(vat).value

  const save = handleSubmit(async (data)=>{
    const res = await fetch('/api/invoice',{ method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ invoice:{...data,subtotal,vat,total} })
    })
    const { url } = await res.json()
    setPdfUrl(url)
  })

  if(!session) return null

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Ny faktura</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm">Faktura #</label>
          <input {...register('number')} className="border p-2 w-full"/>
        </div>
        <div>
          <label className="block text-sm">Dato</label>
          <input type="date" {...register('date')} className="border p-2 w-full"/>
        </div>
      </div>
      <table className="w-full text-sm border-t">
        <thead><tr><th>Vare</th><th className="w-16">Antal</th><th className="w-32">Beløb</th><th></th></tr></thead>
        <tbody>
        {fields.map((f,i)=>(
          <tr key={f.id}>
            <td><input {...register(`items.${i}.name`)} className="border w-full p-1"/></td>
            <td><input type="number" {...register(`items.${i}.qty`)} className="border w-full p-1"/></td>
            <td><input type="number" {...register(`items.${i}.total`)} className="border w-full p-1"/></td>
            <td><button onClick={()=>remove(i)} className="text-red-600">×</button></td>
          </tr>
        ))}
        </tbody>
      </table>
      <button onClick={()=>append({name:'',qty:1,total:0})} className="text-blue-600 text-sm">+ vare</button>
      <div className="text-right">
        <p>Subtotal: {subtotal} kr.</p>
        <p>Moms 25 %: {vat} kr.</p>
        <p className="font-bold">Total: {total} kr.</p>
      </div>
      <button onClick={save} className="bg-indigo-600 text-white px-4 py-2 rounded">Generér PDF</button>
      {pdfUrl && (
        <p className="mt-4">PDF klar – <a href={pdfUrl} target="_blank" className="underline">download her</a></p>
      )}
    </div>
  )
}
