'use client'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { saveVault } from '@/lib/storage'
import { filterVaultByCategory, VaultCategory } from '@/lib/filterVault'

export default function UploadZone({ onLoad }:{ onLoad:(json:any)=>void }){
  const [category, setCategory] = useState<VaultCategory>('personal')
  const [name, setName] = useState('')
  const onDrop = useCallback((files:File[])=>{
    const file = files[0]
    file.text().then(txt=>{
      try{
        const data = JSON.parse(txt)
        const filtered = filterVaultByCategory(data, category)
        let vaultName = name.trim() || (category==='personal' ? 'My Vault' : '')
        if(category==='organization' && !vaultName){
          vaultName = prompt('Vault name?') || ''
          if(!vaultName) return
        }
        filtered.items = filtered.items.map((it:any)=>({ ...it, vault: vaultName || undefined }))
        filtered.vaults = Array.from(new Set([...(filtered.vaults||[]), vaultName].filter(Boolean)))
        onLoad(filtered)
        saveVault(JSON.stringify(filtered))
      }catch{ alert('Invalid export') }
    })
  },[onLoad, category, name])
  const {getRootProps,getInputProps,isDragActive}=useDropzone({onDrop,accept:{'application/json':['.json','.csv']}})
  return (
    <div>
      <div {...getRootProps()} className={`border-2 border-dashed p-8 text-center${isDragActive?' bg-indigo-50':''}`}>
        <input {...getInputProps()} />
        Drop Bitwarden export here or click to select
      </div>
      <div className="mt-2 text-center">
        <label className="mr-2">Import as</label>
        <select value={category} onChange={e=>setCategory(e.target.value as VaultCategory)} className="border px-2 py-1">
          <option value="personal">vault.reipur.dk</option>
          <option value="organization">Organization</option>
        </select>
        <input
          type="text"
          placeholder="Vault name"
          value={name}
          onChange={e=>setName(e.target.value)}
          className="border px-2 py-1 ml-2"
        />
      </div>
    </div>
  )
}
