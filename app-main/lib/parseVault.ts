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

    nodes.push({
      id: itemId,
      type: 'vault', //  <-- custom node
      position: { x: Math.random() * 600, y: Math.random() * 400 },
      data: {
        label: item.name,
        logoUrl: logoFor(dom),
        username: item.login?.username,
      },
    })

    ;(item.login?.uris || []).forEach((u: any, i: number) => {
      try {
        const url = new URL(u.uri)
        const domain = url.hostname.replace(/^www\./, '')
        const emailKey = item.login?.username?.includes('@') ? item.login.username : undefined
        if (emailKey) {
          const emailId = `email-${emailKey}`
          if (!nodes.find(n => n.id === emailId))
            nodes.push({
              id: emailId,
              position: { x: Math.random() * 600, y: Math.random() * 400 },
              data: { label: emailKey },
              type: 'default',
            })
          edges.push({ id: `e-${itemId}-${emailId}-${i}`, source: itemId, target: emailId })
        }
        const domId = `dom-${domain}`
        if (!nodes.find(n => n.id === domId))
          nodes.push({
            id: domId,
            position: { x: Math.random() * 600, y: Math.random() * 400 },
            data: { label: domain, logoUrl: logoFor(domain) },
            type: 'default',
          })
        edges.push({ id: `e-${itemId}-${domId}-${i}`, source: itemId, target: domId })
      } catch {}
    })
  })

  return { nodes, edges }
}
export type VaultGraph = ReturnType<typeof parseVault>