import { CANVAS, type GroupCircle } from './constants'
import type { Group, Item, Membership } from './types'

/** True if `ancestorId` is a strict ancestor of `descendantId` in the group tree. */
export function isStrictAncestorOf(
  groups: Group[],
  ancestorId: string,
  descendantId: string,
): boolean {
  const byId = groupById(groups)
  let c = byId.get(descendantId)
  while (c) {
    if (c.parentGroupId === ancestorId) return true
    if (!c.parentGroupId) return false
    c = byId.get(c.parentGroupId)
  }
  return false
}

/**
 * When multiple nested droppables hit (parent + child), keep only the deepest groups
 * so dropping in the inner circle assigns the child only; inheritance still adds the parent logically.
 * Unrelated overlaps (two roots) keep both.
 */
export function dropPreferDeepestGroups(
  groupIds: string[],
  groups: Group[],
): string[] {
  const uniq = [...new Set(groupIds)]
  return uniq.filter((id) => {
    for (const other of uniq) {
      if (id === other) continue
      if (isStrictAncestorOf(groups, id, other)) return false
    }
    return true
  })
}

const CHILD_R_RATIO = 0.42
const CHILD_Y_FRAC = 0.14

/** Place a child circle fully inside its parent (supports multiple siblings side by side). */
function layoutChildInParent(
  parent: GroupCircle,
  index: number,
  siblingCount: number,
): GroupCircle {
  const r = Math.min(parent.r * CHILD_R_RATIO, parent.r * 0.48)
  if (siblingCount <= 1) {
    return {
      cx: parent.cx,
      cy: parent.cy + parent.r * CHILD_Y_FRAC,
      r,
    }
  }
  const maxOffset = parent.r * 0.5
  const t = siblingCount > 1 ? index / (siblingCount - 1) : 0
  const offsetX = (t - 0.5) * 2 * maxOffset
  return {
    cx: parent.cx + offsetX,
    cy: parent.cy + parent.r * CHILD_Y_FRAC,
    r: r * 0.92,
  }
}

/**
 * Merge root layouts with nested circles derived from `parentGroupId`.
 * Runs until all reachable children get a circle (handles chains).
 */
export function expandNestedLayouts(
  groups: Group[],
  rootLayouts: Record<string, GroupCircle>,
): Record<string, GroupCircle> {
  const out: Record<string, GroupCircle> = { ...rootLayouts }
  let progress = true
  while (progress) {
    progress = false
    const byParent = new Map<string | null, Group[]>()
    for (const g of groups) {
      const k = g.parentGroupId
      const list = byParent.get(k) ?? []
      list.push(g)
      byParent.set(k, list)
    }
    for (const g of groups) {
      if (!g.parentGroupId || out[g.id]) continue
      const parent = out[g.parentGroupId]
      if (!parent) continue
      const siblings = (byParent.get(g.parentGroupId) ?? []).sort((a, b) =>
        a.id.localeCompare(b.id),
      )
      const idx = siblings.findIndex((s) => s.id === g.id)
      out[g.id] = layoutChildInParent(parent, Math.max(0, idx), siblings.length)
      progress = true
    }
  }
  return out
}

/** Roots first (depth 0), then depth 1, … so parents render under children in SVG. */
export function sortGroupsByDepthAsc(
  groups: Group[],
  layouts: Record<string, GroupCircle>,
): Group[] {
  const byId = groupById(groups)
  const depth = (id: string): number => {
    let d = 0
    let c = byId.get(id)
    while (c?.parentGroupId) {
      d++
      c = byId.get(c.parentGroupId)
    }
    return d
  }
  return groups
    .filter((g) => layouts[g.id] != null)
    .sort((a, b) => {
      const da = depth(a.id)
      const db = depth(b.id)
      if (da !== db) return da - db
      return a.id.localeCompare(b.id)
    })
}

export function groupById(groups: Group[]): Map<string, Group> {
  return new Map(groups.map((g) => [g.id, g]))
}

/** Chain from `groupId` up to root: immediate parent first, then grandparent, … */
export function ancestorChain(groups: Group[], groupId: string): Group[] {
  const byId = groupById(groups)
  const chain: Group[] = []
  let current = byId.get(groupId)
  while (current?.parentGroupId) {
    const parent = byId.get(current.parentGroupId)
    if (!parent) break
    chain.push(parent)
    current = parent
  }
  return chain
}

/** All group ids that apply to an item: every direct membership plus every ancestor of each. */
export function effectiveGroupIds(
  groups: Group[],
  itemId: string,
  memberships: Membership[],
): Set<string> {
  const direct = memberships.filter((m) => m.itemId === itemId).map((m) => m.groupId)
  const set = new Set<string>()
  for (const gid of direct) {
    set.add(gid)
    for (const a of ancestorChain(groups, gid)) {
      set.add(a.id)
    }
  }
  return set
}

export function directGroupIds(
  itemId: string,
  memberships: Membership[],
): Set<string> {
  return new Set(
    memberships.filter((m) => m.itemId === itemId).map((m) => m.groupId),
  )
}

export function initials(title: string): string {
  const parts = title.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Evenly spaced on a ring inside the group circle */
export function layoutRingPositions(
  count: number,
  cx: number,
  cy: number,
  ringR: number,
): { x: number; y: number }[] {
  if (count <= 0) return []
  const positions: { x: number; y: number }[] = []
  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2
    positions.push({
      x: cx + ringR * Math.cos(angle),
      y: cy + ringR * Math.sin(angle),
    })
  }
  return positions
}

export function centroidForCircles(
  groupIds: string[],
  layouts: Record<string, GroupCircle>,
): { x: number; y: number } {
  const pts = groupIds.map((id) => layouts[id]).filter(Boolean)
  if (pts.length === 0) {
    return { x: CANVAS.width / 2, y: CANVAS.height / 2 }
  }
  const x = pts.reduce((s, p) => s + p.cx, 0) / pts.length
  const y = pts.reduce((s, p) => s + p.cy, 0) / pts.length
  return { x, y }
}

/** Ring radius for items in a cluster, from the smallest enclosing circle. */
export function ringRadiusForCluster(
  groupIds: string[],
  layouts: Record<string, GroupCircle>,
): number {
  const pts = groupIds.map((id) => layouts[id]).filter(Boolean)
  if (pts.length === 0) return 56
  const inset = (p: GroupCircle) => Math.max(12, Math.min(52, p.r * 0.38))
  const fromCircles = Math.min(...pts.map((p) => Math.max(16, p.r - inset(p))))
  return Math.min(fromCircles, 88)
}

/**
 * Positions for items on the canvas. Clustering uses **direct** memberships intersecting
 * the canvas; items appear because of direct or inherited (effective) membership elsewhere in App.
 */
export function layoutCanvasItemPositions(
  itemsOnCanvas: Item[],
  memberships: Membership[],
  layouts: Record<string, GroupCircle>,
  canvasGroupIds: Set<string>,
): Map<string, { x: number; y: number }> {
  const byCluster = new Map<string, Item[]>()
  for (const item of itemsOnCanvas) {
    const direct = [...directGroupIds(item.id, memberships)].filter((g) =>
      canvasGroupIds.has(g),
    )
    direct.sort()
    const key = direct.join(',')
    const list = byCluster.get(key) ?? []
    list.push(item)
    byCluster.set(key, list)
  }

  const positions = new Map<string, { x: number; y: number }>()
  for (const [, clusterItems] of byCluster) {
    const sample = clusterItems[0]
    if (!sample) continue
    const groupIdsForCluster = [...directGroupIds(sample.id, memberships)].filter(
      (g) => canvasGroupIds.has(g),
    )
    const { x: cx, y: cy } = centroidForCircles(groupIdsForCluster, layouts)
    const ringR = ringRadiusForCluster(groupIdsForCluster, layouts)
    const ring = layoutRingPositions(clusterItems.length, cx, cy, ringR)
    clusterItems.forEach((item, i) => {
      const pt = ring[i]
      if (pt) positions.set(item.id, pt)
    })
  }
  return positions
}

export function itemTooltipWithGroups(
  item: Item,
  groups: Group[],
  memberships: Membership[],
): string {
  const direct = [...directGroupIds(item.id, memberships)]
    .map((id) => groups.find((g) => g.id === id)?.name ?? id)
    .join(', ')
  if (!direct) return item.title
  return `${item.title} — ${direct}`
}
