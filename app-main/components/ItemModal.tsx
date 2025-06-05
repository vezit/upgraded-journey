'use client'
import { useVault } from '@/contexts/VaultStore'

export default function ItemModal({ index, onClose }:{ index:number, onClose:()=>void }){
  const { vault, updateItem } = useVault()
  if(!vault) return null
  const item = vault.items?.[index]
  if(!item) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded p-4 w-72" onClick={e=>e.stopPropagation()}>
        <h2 className="text-lg mb-2">Edit Item</h2>
        <div className="flex flex-col gap-2">
          <input className="border px-2 py-1" value={item.name || ''} onChange={e=>updateItem(index,'name',e.target.value)} placeholder="Name" />
          <input className="border px-2 py-1" value={item.login?.username || ''} onChange={e=>updateItem(index,'username',e.target.value)} placeholder="Username" />
          <input className="border px-2 py-1" value={item.login?.password || ''} onChange={e=>updateItem(index,'password',e.target.value)} placeholder="Password" />
          <input className="border px-2 py-1" value={item.login?.uris?.[0]?.uri || ''} onChange={e=>updateItem(index,'uri',e.target.value)} placeholder="URI" />
          <button className="mt-2 bg-indigo-600 text-white py-1 rounded" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
