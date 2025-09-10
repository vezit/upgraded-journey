const KEY = 'vault-data'
const Z_KEY = 'vault-zindex'

export const saveVault = (raw: string) => {
  try {
    localStorage.setItem(KEY, raw)
  } catch {}
}
export const loadVault = ()=>{
  try{ const raw = localStorage.getItem(KEY); return raw? JSON.parse(raw):null }catch{ return null }
}
export const clearVault = ()=>{
  try{ localStorage.removeItem(KEY) }catch{}
}



export const saveZIndex = (map:Record<string,number>)=>{
  try{ localStorage.setItem(Z_KEY, JSON.stringify(map)) }catch{}
}
export const loadZIndex = ()=>{
  try{ const raw = localStorage.getItem(Z_KEY); return raw? JSON.parse(raw):{} }catch{ return {} }
}
export const clearZIndex = ()=>{
  try{ localStorage.removeItem(Z_KEY) }catch{}
}

// One-time cleanup function to remove legacy data
export const cleanupLegacyData = () => {
  try { 
    localStorage.removeItem('vault-history')
    localStorage.removeItem('onboarding-vault-items')
  } catch {}
}
