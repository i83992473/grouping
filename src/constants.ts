export const CANVAS = {
  width: 800,
  height: 420,
} as const

/** Visual layout for root-level groups on the canvas (Venn-style overlap). */
export type GroupCircle = { cx: number; cy: number; r: number }

export const GROUP_CIRCLE_LAYOUT: Record<string, GroupCircle> = {
  g1: { cx: 300, cy: 220, r: 125 },
  g2: { cx: 500, cy: 220, r: 125 },
}

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
