import type { Edge, Node } from 'reactflow'
import { loadZIndex } from './storage'

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
  const positionMap: Record<string, { x: number; y: number }> = {}

  // -------------------------------------------------------------------------
  // Pass 1: create all nodes and collect slugs
  // Recovery methods appear first so they get placed in the top rows
  // -------------------------------------------------------------------------
  const itemsSorted = [...vault.items].sort((a: any, b: any) => {
    const getRec = (it: any) => {
      const fld = it.fields?.find((f: any) => f.name === 'vaultdiagram')?.value
      if (!fld) return false
      try { return !!JSON.parse(fld).recoveryNode } catch { return false }
    }
    const aRec = getRec(a)
    const bRec = getRec(b)
    if (aRec === bRec) return 0
    return aRec ? -1 : 1
  })

  itemsSorted.forEach((item: any) => {
    const itemId = `item-${item.id}`
    const firstUri = item.login?.uris?.[0]?.uri
    const dom = domainFrom(firstUri)
    const diagRaw = item.fields?.find((f: any) => f.name === 'vaultdiagram')?.value
    let diag: any = {}
    try { diag = diagRaw ? JSON.parse(diagRaw) : {} } catch {}
    const customLogoUrl = diag.logoUrl
    const nestedDom = diag.nestedDomain
    const nestedLogoUrl = nestedDom ? logoFor(nestedDom) : undefined

    const isRecovery = !!diag.recoveryNode

    let twofaProviders: string[] = []
    if (diag.twofaMap) {
      const arr = diag.twofaMap.providers
      if (Array.isArray(arr)) twofaProviders = arr
    }
    const has2fa = twofaProviders.length > 0

    const slug = diag.id
    if (slug) slugToId[slug] = itemId

    const x = margin + col * stepX
    const y = margin + row * stepY
    col++
    if (col >= perRow) {
      col = 0
      row++
    }

    const position = diag.position && typeof diag.position.x === 'number' && typeof diag.position.y === 'number'
      ? diag.position
      : { x, y }
    if (diag.position) positionMap[itemId] = diag.position

    nodes.push({
      id: itemId,
      type: 'vault',
      position,
      data: {
        label: item.name,
        logoUrl: customLogoUrl || logoFor(dom),
        nestedLogoUrl,
        username: item.login?.username,
        isRecovery,
        has2fa,
        genericIconId: diag.genericIcon,
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
  // Apply saved positions from vault data if available
  // -----------------------------------------------------------------------
  nodes.forEach(n => {
    const pos = positionMap[n.id]
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
