import { parseVault } from './parseVault'

const KEY = 'vault-data'

export const saveVault = (raw:string)=>{
  try{ localStorage.setItem(KEY, raw) }catch{}
}
export const loadVault = ()=>{
  try{ const raw = localStorage.getItem(KEY); return raw? parseVault(JSON.parse(raw)):null }catch{ return null }
}
export const clearVault = ()=>{
  try{ localStorage.removeItem(KEY) }catch{}
}
