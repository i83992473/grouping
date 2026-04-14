export const CANVAS = {
  width: 800,
  height: 420,
  group: { cx: 400, cy: 210, r: 140 },
} as const

export const DND_ITEM_PREFIX = 'item:' as const
export const DND_PALETTE_ID = 'droppable-palette' as const

export function droppableGroupId(groupId: string): string {
  return `droppable-group:${groupId}`
}

export function parseItemDragId(id: string | number): string | null {
  const s = String(id)
  if (!s.startsWith(DND_ITEM_PREFIX)) return null
  return s.slice(DND_ITEM_PREFIX.length)
}
