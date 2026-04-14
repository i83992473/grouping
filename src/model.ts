import type { Group, Membership } from './types'

export function groupById(groups: Group[]): Map<string, Group> {
  return new Map(groups.map((g) => [g.id, g]))
}

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
