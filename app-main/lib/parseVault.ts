import type { Edge, Node } from 'reactflow'

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------
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
// parseVault – converts a Bitwarden export into nodes + edges for React Flow
// ---------------------------------------------------------------------------
export const parseVault = (vault: any) => {
  const nodes: Node[] = []
  const edges: Edge[] = []

  if (!vault?.items) return { nodes, edges }

  // -------------------------------------------------------------------------
  // Basic grid positioning – we’ll tweak recovery‑nodes later on
  // -------------------------------------------------------------------------
  const { width } = (() => {
    if (typeof window === 'undefined') return { width: 600 }
    return { width: window.innerWidth }
  })()

  const margin = 40
  const stepX = 170
  const stepY = 140
  const perRow = Math.max(1, Math.floor((width - margin * 2) / stepX))
  let col = 0
  let row = 0

  // Slug → item‑id lookup for JSON‑based recovery mapping
  const slugToId: Record<string, string> = {}

  // -------------------------------------------------------------------------
  // Pass 1: create all nodes and collect slugs
  // -------------------------------------------------------------------------
  vault.items.forEach((item: any) => {
    const itemId = `item-${item.id}`
    const firstUri = item.login?.uris?.[0]?.uri
    const dom = domainFrom(firstUri)

    const isRecovery = item.fields?.some(
      (f: any) =>
        f.name === 'recovery_node' && String(f.value).toLowerCase() === 'true',
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
      type: 'vault',
      position: { x, y },
      data: {
        label: item.name,
        logoUrl: logoFor(dom),
        username: item.login?.username,
        isRecovery,
      },
    })
  })

  // -------------------------------------------------------------------------
  // Pass 2: create edges
  // -------------------------------------------------------------------------
  vault.items.forEach((item: any) => {
    const source = `item-${item.id}`

    // a) legacy single‑id field ------------------------------------------------
    item.fields?.forEach((f: any) => {
      if (f.name === 'recovery' && f.value) {
        const target = `item-${f.value}`
        edges.push({ id: `edge-${source}-${target}`, source, target, style: { stroke: '#8b5cf6' } })
      }
    })

    // b) JSON mapping ---------------------------------------------------------
    const mapField = item.fields?.find((f: any) => f.name === 'vaultdiagram-recovery-map')?.value
    if (!mapField) return

    let map: any
    try {
      map = JSON.parse(mapField)
    } catch {
      return // ignore invalid JSON
    }

    const recovers: string[] = Array.isArray(map.recovers) ? map.recovers : []
    const recoveredBy: string[] = Array.isArray(map.recovered_by) ? map.recovered_by : []

    recovers.forEach((slug) => {
      const target = slugToId[slug]
      if (target)
        edges.push({ id: `edge-${source}-${target}`, source, target, style: { stroke: '#8b5cf6' } })
    })

    recoveredBy.forEach((slug) => {
      const src = slugToId[slug]
      if (src)
        edges.push({ id: `edge-${src}-${source}`, source: src, target: source, style: { stroke: '#8b5cf6' } })
    })
  })

  // -------------------------------------------------------------------------
  // Pass 3: iterative layout tweak – place recovery nodes BELOW dependants
  // We run a few iterations so chains (A → B → C) cascade correctly.
  // -------------------------------------------------------------------------
  const nodeMap: Record<string, Node> = {}
  nodes.forEach((n) => (nodeMap[n.id] = n))

  const iterations = 3
  for (let i = 0; i < iterations; i++) {
    nodes.forEach((n) => {
      if (!n.data?.isRecovery) return

      const incoming = edges.filter((e) => e.target === n.id)
      if (!incoming.length) return

      const xs = incoming.map((e) => nodeMap[e.source]?.position.x || 0)
      const ys = incoming.map((e) => nodeMap[e.source]?.position.y || 0)

      const avgX = xs.reduce((a, b) => a + b, 0) / xs.length
      const maxY = Math.max(...ys)

      n.position.x = avgX
      n.position.y = maxY + stepY
    })
  }

  return { nodes, edges }
}

export type VaultGraph = ReturnType<typeof parseVault>
