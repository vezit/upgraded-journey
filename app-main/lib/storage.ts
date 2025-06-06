const KEY = 'vault-data'
const POS_KEY = 'vault-positions'
const Z_KEY = 'vault-zindex'
const HISTORY_KEY = 'vault-history'

export const saveVault = (raw: string) => {
  try {
    localStorage.setItem(KEY, raw)
    const histRaw = localStorage.getItem(HISTORY_KEY)
    const hist = histRaw ? JSON.parse(histRaw) : []
    hist.push({ timestamp: Date.now(), data: raw })
    localStorage.setItem(HISTORY_KEY, JSON.stringify(hist))
  } catch {}
}
export const loadVault = ()=>{
  try{ const raw = localStorage.getItem(KEY); return raw? JSON.parse(raw):null }catch{ return null }
}
export const clearVault = ()=>{
  try{ localStorage.removeItem(KEY) }catch{}
}

export const loadHistory = (): { timestamp: number; data: string }[] => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export const clearHistory = () => {
  try { localStorage.removeItem(HISTORY_KEY) } catch {}
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

export const saveZIndex = (map:Record<string,number>)=>{
  try{ localStorage.setItem(Z_KEY, JSON.stringify(map)) }catch{}
}
export const loadZIndex = ()=>{
  try{ const raw = localStorage.getItem(Z_KEY); return raw? JSON.parse(raw):{} }catch{ return {} }
}
export const clearZIndex = ()=>{
  try{ localStorage.removeItem(Z_KEY) }catch{}
}
