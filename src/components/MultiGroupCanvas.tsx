import { useDroppable } from '@dnd-kit/core'
import { CANVAS, type GroupCircle, droppableGroupId } from '../constants'
import { groupById } from '../model'
import type { Group, Item } from '../types'
import { ItemChip } from './ItemChip'

type Props = {
  canvasGroups: Group[]
  groups: Group[]
  layouts: Record<string, GroupCircle>
  items: Item[]
  itemPositions: Map<string, { x: number; y: number }>
  tooltipForItem: (item: Item) => string
  directCountOnCanvas: (item: Item) => number
  onOpenItem: (item: Item) => void
}

function depthOf(group: Group, all: Group[]): number {
  const byId = groupById(all)
  let d = 0
  let c: Group | undefined = group
  while (c?.parentGroupId) {
    d++
    c = byId.get(c.parentGroupId)
  }
  return d
}

function GroupDropCircle({
  group,
  layout,
  stackOrder,
}: {
  group: Group
  layout: GroupCircle
  stackOrder: number
}) {
  const dropId = droppableGroupId(group.id)
  const { setNodeRef, isOver } = useDroppable({ id: dropId })
  const { cx, cy, r } = layout
  const box = 2 * r

  return (
    <div
      ref={setNodeRef}
      className={`group-canvas__drop ${isOver ? 'group-canvas__drop--over' : ''}`.trim()}
      style={{
        left: `${((cx - r) / CANVAS.width) * 100}%`,
        top: `${((cy - r) / CANVAS.height) * 100}%`,
        width: `${(box / CANVAS.width) * 100}%`,
        aspectRatio: '1',
        zIndex: 2 + stackOrder,
      }}
      aria-label={`Drop zone for ${group.name}`}
    />
  )
}

export function MultiGroupCanvas({
  canvasGroups,
  groups,
  layouts,
  items,
  itemPositions,
  tooltipForItem,
  directCountOnCanvas,
  onOpenItem,
}: Props) {
  return (
    <div className="group-canvas">
      <svg
        className="group-canvas__svg"
        viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden
      >
        <defs>
          <filter id="group-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.12" />
          </filter>
        </defs>
        {canvasGroups.map((g, i) => {
          const layout = layouts[g.id]
          if (!layout) return null
          const depth = depthOf(g, groups)
          const alt = i % 2 === 1
          return (
            <g key={g.id}>
              <circle
                cx={layout.cx}
                cy={layout.cy}
                r={layout.r}
                className={`group-canvas__circle ${alt ? 'group-canvas__circle--alt' : ''} ${depth > 0 ? 'group-canvas__circle--nested' : ''}`.trim()}
                filter="url(#group-shadow)"
              />
              <text
                x={layout.cx}
                y={layout.cy - layout.r - 6}
                textAnchor="middle"
                className="group-canvas__label"
              >
                {g.name}
              </text>
            </g>
          )
        })}
      </svg>

      {canvasGroups.map((g, i) => {
        const layout = layouts[g.id]
        if (!layout) return null
        return (
          <GroupDropCircle
            key={`drop-${g.id}`}
            group={g}
            layout={layout}
            stackOrder={i}
          />
        )
      })}

      {items.map((item) => {
        const pos = itemPositions.get(item.id)
        if (!pos) return null
        return (
          <div
            key={item.id}
            className="group-canvas__item-wrap"
            style={{
              left: `${(pos.x / CANVAS.width) * 100}%`,
              top: `${(pos.y / CANVAS.height) * 100}%`,
            }}
          >
            <ItemChip
              item={item}
              onOpen={onOpenItem}
              title={tooltipForItem(item)}
              membershipBadge={
                directCountOnCanvas(item) > 1 ? directCountOnCanvas(item) : undefined
              }
            />
          </div>
        )
      })}
    </div>
  )
}
