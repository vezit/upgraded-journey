import type { Edge, Node } from 'reactflow'

// quick helper ---------------------------------------------------------------
const domainFrom = (raw: string | undefined) =>
  raw ? new URL(raw).hostname.replace(/^www\./, '') : undefined

const logoFor = (domain?: string) =>
  domain ? `https://logo.clearbit.com/${domain}` : '/img/default.svg'

// ---------------------------------------------------------------------------
// Nothing else changes – we just add `type`, `logoUrl` and a random position.
export const parseVault = (vault: any) => {
  const nodes: Node[] = []
  const edges: Edge[] = []

  if (!vault?.items) return { nodes, edges }

  vault.items.forEach((item: any) => {
    const itemId = `item-${item.id}`
    const firstUri = item.login?.uris?.[0]?.uri
    const dom = domainFrom(firstUri)
    const isRecovery = item.fields?.some((f:any)=>f.name==='recovery_node' && String(f.value).toLowerCase()==='true')

    nodes.push({
      id: itemId,
      type: 'vault', //  <-- custom node
      position: { x: Math.random() * 600, y: Math.random() * 400 },
      data: {
        label: item.name,
        logoUrl: logoFor(dom),
        username: item.login?.username,
        isRecovery,
      },
    })
  })

  vault.items.forEach((item:any)=>{
    const source = `item-${item.id}`
    item.fields?.forEach((f:any)=>{
      if(f.name==='recovery' && f.value){
        const target = `item-${f.value}`
        edges.push({
          id:`edge-${source}-${target}`,
          source,
          target,
          style:{ stroke:'#8b5cf6' },
        })
      }
    })
  })

  return { nodes, edges }
}

export type VaultGraph = ReturnType<typeof parseVault>
