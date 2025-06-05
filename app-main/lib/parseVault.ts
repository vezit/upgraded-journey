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

  vault.items.forEach((item: any) => {
    const itemId = `item-${item.id}`
    const firstUri = item.login?.uris?.[0]?.uri
    const dom = domainFrom(firstUri)

    const isRecovery = item.fields?.some(
      (f: any) => f.name === 'recovery_node' && String(f.value).toLowerCase() === 'true',
    )

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
  // Create recovery edges (source ➜ target)
  // -------------------------------------------------------------------------
  vault.items.forEach((item: any) => {
    const source = `item-${item.id}`
    item.fields?.forEach((f: any) => {
      if (f.name === 'recovery' && f.value) {
        const target = `item-${f.value}`
        edges.push({
          id: `edge-${source}-${target}`,
          source,
          target,
          style: { stroke: '#8b5cf6' },
        })
      }
    })
  })

  // -------------------------------------------------------------------------
  // SECOND‑PASS LAYOUT TWEAK -------------------------------------------------
  // We want every *recovery node* to sit **below** the accounts it can recover
  // (as per the demo’s desired appearance).
  // -------------------------------------------------------------------------
  const nodeMap: Record<string, Node> = {}
  nodes.forEach((n) => (nodeMap[n.id] = n))

  nodes.forEach((n) => {
    if (!n.data?.isRecovery) return

    // Who points at me?
    const incoming = edges.filter((e) => e.target === n.id)
    if (!incoming.length) return

    const xs = incoming.map((e) => nodeMap[e.source]?.position.x || 0)
    const ys = incoming.map((e) => nodeMap[e.source]?.position.y || 0)

    const avgX = xs.reduce((a, b) => a + b, 0) / xs.length
    const maxY = Math.max(...ys)

    // Re‑centre horizontally and push one row **below** dependants
    n.position.x = avgX
    n.position.y = maxY + stepY
  })

  return { nodes, edges }
}

export type VaultGraph = ReturnType<typeof parseVault>
