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

  const nameToId: Record<string, string> = {}

  vault.items.forEach((item: any) => {
    const itemId = `item-${item.id}`
    const firstUri = item.login?.uris?.[0]?.uri
    const dom = domainFrom(firstUri)

    nameToId[item.name] = itemId

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
  })

  const added = new Set<string>()

  vault.items.forEach((item: any) => {
    const itemId = nameToId[item.name]
    const field = item.fields?.find((f: any) => f.name === 'vaultdiagram-recovery-map')
    if (!field || typeof field.value !== 'string') return
    try {
      const data = JSON.parse(field.value)
      if (Array.isArray(data.recovers)) {
        data.recovers.forEach((t: string) => {
          const targetId = nameToId[t]
          if (targetId) {
            const id = `edge-${itemId}-${targetId}`
            if (!added.has(id)) {
              edges.push({ id, source: itemId, target: targetId })
              added.add(id)
            }
          }
        })
      }
      if (Array.isArray(data.recovered_by)) {
        data.recovered_by.forEach((s: string) => {
          const sourceId = nameToId[s]
          if (sourceId) {
            const id = `edge-${sourceId}-${itemId}`
            if (!added.has(id)) {
              edges.push({ id, source: sourceId, target: itemId })
              added.add(id)
            }
          }
        })
      }
    } catch (err) {
      // ignore parse errors
    }
  })

  return { nodes, edges }
}
export type VaultGraph = ReturnType<typeof parseVault>