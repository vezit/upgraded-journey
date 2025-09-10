import type { Edge, Node } from 'reactflow'
import { loadPositions, loadZIndex } from './storage'

const orientEdges = (_nodes: Node[], edges: Edge[]): Edge[] => edges

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
  domain ? `https://${domain}/favicon.ico` : '/img/default.svg'

// ---------------------------------------------------------------------------
// parseVault – converts a Bitwarden export into nodes + edges for React Flow
// ---------------------------------------------------------------------------
export const parseVault = (vault: any, shrinkGroups = false) => {
  const nodes: Node[] = []
  const edges: Edge[] = []
  const edgeIds = new Set<string>()

  const addEdgeUnique = (edge: Edge) => {
    if (edgeIds.has(edge.id)) return
    edgeIds.add(edge.id)
    edges.push(edge)
  }

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
  // Recovery methods appear first so they get placed in the top rows
  // -------------------------------------------------------------------------
  const itemsSorted = [...vault.items].sort((a: any, b: any) => {
    const aRec = a.fields?.some(
      (f: any) => f.name === 'recovery_node' && String(f.value).toLowerCase() === 'true',
    )
    const bRec = b.fields?.some(
      (f: any) => f.name === 'recovery_node' && String(f.value).toLowerCase() === 'true',
    )
    if (aRec === bRec) return 0
    return aRec ? -1 : 1
  })

  itemsSorted.forEach((item: any) => {
    const itemId = `item-${item.id}`
    const firstUri = item.login?.uris?.[0]?.uri
    const dom = domainFrom(firstUri)
    const customLogoUrl = item.fields?.find(
      (f: any) => f.name === 'vaultdiagram-logo-url',
    )?.value
    const nestedDom = item.fields?.find(
      (f: any) => f.name === 'vaultdiagram-nested-domain',
    )?.value
    const nestedLogoUrl = nestedDom ? logoFor(nestedDom) : undefined

    const isRecovery = item.fields?.some(
      (f: any) =>
        f.name === 'recovery_node' && String(f.value).toLowerCase() === 'true',
    )

    const twofaField = item.fields?.find((f: any) => f.name === 'vaultdiagram-2fa-map')?.value
    let twofaProviders: string[] = []
    if (twofaField) {
      try {
        const map = JSON.parse(twofaField)
        twofaProviders = Array.isArray(map.providers) ? map.providers : []
      } catch {}
    }
    const has2fa = twofaProviders.length > 0

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
        logoUrl: customLogoUrl || logoFor(dom),
        nestedLogoUrl,
        username: item.login?.username,
        isRecovery,
        has2fa,
      },
    })
  })

  // -------------------------------------------------------------------------
  // Skip edge creation - no lines between items
  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------
  // Pass 3: iterative layout tweak – place recovery nodes ABOVE dependants
  // We run a few iterations so chains (A → B → C) cascade correctly.
  // -------------------------------------------------------------------------
  const nodeMap: Record<string, Node> = {}
  nodes.forEach((n) => (nodeMap[n.id] = n))

  const iterations = 3
  for (let i = 0; i < iterations; i++) {
    nodes.forEach((n) => {
      if (!n.data?.isRecovery) return

      const outgoing = edges.filter((e) => e.source === n.id)
      if (!outgoing.length) return

      const xs = outgoing.map((e) => nodeMap[e.target]?.position.x || 0)
      const ys = outgoing.map((e) => nodeMap[e.target]?.position.y || 0)

      const avgX = xs.reduce((a, b) => a + b, 0) / xs.length
      const minY = Math.min(...ys)

      n.position.x = avgX
      n.position.y = minY - stepY
    })
  }

  // -----------------------------------------------------------------------
  // Apply saved positions from local storage if available
  // -----------------------------------------------------------------------
  const saved = loadPositions()
  nodes.forEach(n => {
    const pos = saved[n.id]
    if(pos) n.position = pos
  })

  // -----------------------------------------------------------------------
  // Apply saved z-index values
  // -----------------------------------------------------------------------
  const zmap = loadZIndex()
  nodes.forEach(n => {
    const z = zmap[n.id]
    if(z!==undefined) n.style = { ...(n.style||{}), zIndex: z }
  })

  // -----------------------------------------------------------------------
  // Skip folder grouping - items will be displayed without group containers
  // -----------------------------------------------------------------------

  const oriented = orientEdges(nodes, edges)
  return { nodes, edges: oriented }
}

export type VaultGraph = ReturnType<typeof parseVault>
