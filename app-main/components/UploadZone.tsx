'use client'
import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { saveVault } from '@/lib/storage'

export default function UploadZone({ onLoad }:{ onLoad:(json:any)=>void }){
  const onDrop = useCallback((files:File[])=>{
    const file = files[0]
    file.text().then(txt=>{
      try{ onLoad(JSON.parse(txt)); saveVault(txt) }
      catch{ alert('Invalid export') }
    })
  },[onLoad])
  const {getRootProps,getInputProps,isDragActive}=useDropzone({onDrop,accept:{'application/json':['.json','.csv']}})
  return (
    <div {...getRootProps()} className={`border-2 border-dashed p-8 text-center ${isDragActive?'bg-indigo-50':''}`}>
      <input {...getInputProps()} />
      Drop Bitwarden export here or click to select
    </div>
  )
}
