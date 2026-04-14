import { CANVAS, type GroupCircle } from './constants'
import type { Group, Item, Membership } from './types'

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
  const fromCircles = Math.min(...pts.map((p) => Math.max(28, p.r - 52)))
  return Math.min(fromCircles, 88)
}

/**
 * Positions for items that appear on the canvas (direct membership in at least one laid-out group).
 * Items with the same set of canvas group memberships share a ring around the centroid of those circles.
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
