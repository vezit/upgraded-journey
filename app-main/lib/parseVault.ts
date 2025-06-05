import type { Edge, Node } from 'reactflow'

// quick helper ---------------------------------------------------------------
const domainFrom = (raw: string | undefined) => {
  if (!raw) return undefined
  try {
    return new URL(raw).hostname.replace(/^www\./, '')
  } catch {
    try {
      return new URL(`http://${raw}`).hostname.replace(/^www\./, '')
    } catch {
      return undefined
    }
  }
}

const logoFor = (domain?: string) =>
  domain ? `https://logo.clearbit.com/${domain}` : '/img/default.svg'

// ---------------------------------------------------------------------------
// Nothing else changes – we just add `type`, `logoUrl` and a random position.
export const parseVault = (vault: any) => {
  const nodes: Node[] = []
  const edges: Edge[] = []

  if (!vault?.items) return { nodes, edges }

  const { width, height } = (() => {
    if (typeof window === 'undefined') return { width: 600, height: 400 }
    return { width: window.innerWidth, height: window.innerHeight * 0.8 }
  })()

  const margin = 40
  const stepX = 170
  const stepY = 140
  const perRow = Math.max(1, Math.floor((width - margin * 2) / stepX))
  let col = 0
  let row = 0

  const slugToId: Record<string, string> = {}

  vault.items.forEach((item: any) => {
    const itemId = `item-${item.id}`
    const firstUri = item.login?.uris?.[0]?.uri
    const dom = domainFrom(firstUri)
    const isRecovery = item.fields?.some(
      (f: any) =>
        f.name === 'recovery_node' &&
        String(f.value).toLowerCase() === 'true'
    )

    const slug = item.fields?.find((f: any) => f.name === 'vaultdiagram-id')?.value
    if (slug) slugToId[slug] = itemId

    const x = margin + col * stepX
    const y = margin + row * stepY
    col++
    if (col >= perRow) {
      col = 0
      row++
    }

    nodes.push({
      id: itemId,
      type: 'vault', //  <-- custom node
      position: { x, y },
      data: {
        label: item.name,
        logoUrl: logoFor(dom),
        username: item.login?.username,
        isRecovery,
      },
    })
  })


  vault.items.forEach((item: any) => {
    const source = `item-${item.id}`
    const mapField = item.fields?.find((f: any) => f.name === 'vaultdiagram-recovery-map')?.value
    if (!mapField) return
    let map: any
    try {
      map = JSON.parse(mapField)
    } catch {
      return
    }
    const recovers: string[] = Array.isArray(map.recovers) ? map.recovers : []
    const recoveredBy: string[] = Array.isArray(map.recovered_by) ? map.recovered_by : []
    recovers.forEach(slug => {
      const target = slugToId[slug]
      if (target)
        edges.push({ id: `edge-${source}-${target}`, source, target, style: { stroke: '#8b5cf6' } })
    })
    recoveredBy.forEach(slug => {
      const src = slugToId[slug]
      if (src)
        edges.push({ id: `edge-${src}-${source}`, source: src, target: source, style: { stroke: '#8b5cf6' } })
    })
  })

  const nodeMap: Record<string, Node> = {}
  nodes.forEach(n => (nodeMap[n.id] = n))

  nodes.forEach(n => {
    if (!n.data?.isRecovery) return
    const related = edges.filter(e => e.target === n.id)
    if (!related.length) return
    const xs = related.map(e => nodeMap[e.source]?.position.x || 0)
    const ys = related.map(e => nodeMap[e.source]?.position.y || 0)
    const avgX = xs.reduce((a, b) => a + b, 0) / xs.length
    const minY = Math.min(...ys)
    n.position.x = avgX
    n.position.y = minY - stepY
  })

  return { nodes, edges }
}

export type VaultGraph = ReturnType<typeof parseVault>
