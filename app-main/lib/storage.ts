const KEY = 'vault-data'
const POS_KEY = 'vault-positions'

export const saveVault = (raw:string)=>{
  try{ localStorage.setItem(KEY, raw) }catch{}
}
export const loadVault = ()=>{
  try{ const raw = localStorage.getItem(KEY); return raw? JSON.parse(raw):null }catch{ return null }
}
export const clearVault = ()=>{
  try{ localStorage.removeItem(KEY) }catch{}
}

export const savePositions = (map:Record<string,{x:number,y:number}>)=>{
  try{ localStorage.setItem(POS_KEY, JSON.stringify(map)) }catch{}
}
export const loadPositions = ()=>{
  try{ const raw = localStorage.getItem(POS_KEY); return raw? JSON.parse(raw):{} }catch{ return {} }
}
export const clearPositions = ()=>{
  try{ localStorage.removeItem(POS_KEY) }catch{}
}
