import type { Edge, Node } from 'reactflow'
import { loadPositions } from './storage'

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
  domain ? `https://logo.clearbit.com/${domain}?size=80` : '/img/default.svg'

// ---------------------------------------------------------------------------
// parseVault – converts a Bitwarden export into nodes + edges for React Flow
// ---------------------------------------------------------------------------
export const parseVault = (vault: any, shrinkGroups = false) => {
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
  const idToFolder: Record<string, string | undefined> = {}

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
    idToFolder[itemId] = item.folderId

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

    const twofaField = item.fields?.find((f: any) => f.name === 'vaultdiagram-2fa-map')?.value
    if (twofaField) {
      try {
        const map2fa = JSON.parse(twofaField)
        const providers: string[] = Array.isArray(map2fa.providers) ? map2fa.providers : []
        providers.forEach((slug: string) => {
          const src = slugToId[slug]
          if (src) {
            const stroke = idToFolder[source] === '2favault.reipur.dk' ? '#8b5cf6' : '#0ea5e9'
            edges.push({ id: `edge-2fa-${src}-${source}`, source: src, target: source, style: { stroke, strokeDasharray: '4 2' } })
          }
        })
      } catch {}
    }
  })

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
  // Group nodes based on folder information
  // -----------------------------------------------------------------------
  const folderDefs: Record<string, { name: string; parentId?: string }> = {}
  ;(vault.folders || []).forEach((f: any) => {
    folderDefs[f.id] = { name: f.name, parentId: f.parentId }
  })

  const folderChildren: Record<string, Node[]> = {}
  ;(vault.folders || []).forEach((f: any) => {
    folderChildren[f.id] = []
  })

  vault.items.forEach((item: any) => {
    if (!item.folderId) return
    const node = nodes.find((n) => n.id === `item-${item.id}`)
    if (!node) return
    folderChildren[item.folderId].push(node)
  })

  const depthOf = (id: string): number => {
    let depth = 0
    let pid = folderDefs[id]?.parentId
    while (pid) {
      depth++
      pid = folderDefs[pid]?.parentId
    }
    return depth
  }

  const foldersSorted = Object.keys(folderDefs).sort(
    (a, b) => depthOf(b) - depthOf(a),
  )

  const groupNodes: Record<string, Node> = {}

  foldersSorted.forEach((fid) => {
    const children = folderChildren[fid]
    if (children.length === 0) return

    const def = folderDefs[fid] || { name: fid }

    const minX = Math.min(...children.map((n) => n.position.x))
    const minY = Math.min(...children.map((n) => n.position.y))
    const maxX = Math.max(...children.map((n) => n.position.x))
    const maxY = Math.max(...children.map((n) => n.position.y))

    const pad = shrinkGroups ? 10 : 40
    let pos = { x: minX - pad, y: minY - pad }
    let width = maxX - minX + stepX + (shrinkGroups ? 0 : pad * 2)
    let height = maxY - minY + stepY + (shrinkGroups ? 0 : pad * 2)
    const groupId = `folder-${fid}`

    const siblings = Object.values(groupNodes).filter(g => (g as any).parentNode === (def.parentId ? `folder-${def.parentId}` : undefined))
    const rectsOverlap = (a:{x:number,y:number,width:number,height:number}, b:{x:number,y:number,width:number,height:number}) =>
      a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
    while (siblings.some(g => rectsOverlap({x:pos.x,y:pos.y,width,height}, {x:g.position.x,y:g.position.y,width:(g.style as any)?.width || 0,height:(g.style as any)?.height || 0}))) {
      pos.y += height + margin
    }

    let offsetAbove = 0
    if (fid === '2favault.reipur.dk') {
      offsetAbove = pos.y + height + margin
    }
    pos.y -= offsetAbove
    if (offsetAbove) {
      children.forEach(n => {
        n.position.y -= offsetAbove
      })
    }

    children.forEach((n) => {
      n.position.x -= pos.x
      n.position.y -= pos.y
      ;(n as any).parentNode = groupId
      if(!shrinkGroups) (n as any).extent = 'parent'
    })

    const groupNode: Node = {
      id: groupId,
      type: 'group',
      position: pos,
      data: { label: def.name },
      style: {
        width,
        height,
        padding: 10,
        border: '1px dashed #94a3b8',
        background: '#f8fafc',
        zIndex: -1,
      },
      ...(def.parentId
        ? { parentNode: `folder-${def.parentId}`, extent: 'parent' }
        : {}),
    }

    nodes.push(groupNode)
    groupNodes[fid] = groupNode

    if (def.parentId) {
      folderChildren[def.parentId].push(groupNode)
    }
  })

  return { nodes, edges }
}

export type VaultGraph = ReturnType<typeof parseVault>
