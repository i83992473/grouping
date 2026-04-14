import { useDroppable } from '@dnd-kit/core'
import { CANVAS, droppableGroupId } from '../constants'
import { layoutRingPositions } from '../model'
import type { Group, Item } from '../types'
import { ItemChip } from './ItemChip'

type Props = {
  group: Group
  items: Item[]
  onOpenItem: (item: Item) => void
}

export function GroupCanvas({ group, items, onOpenItem }: Props) {
  const { cx, cy, r } = CANVAS.group
  const dropId = droppableGroupId(group.id)
  const { setNodeRef, isOver } = useDroppable({ id: dropId })
  const ringR = Math.min(r - 48, 78)
  const ring = layoutRingPositions(items.length, cx, cy, ringR)

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
        <circle
          cx={cx}
          cy={cy}
          r={r}
          className="group-canvas__circle"
          filter="url(#group-shadow)"
        />
        <text x={cx} y={cy - r - 14} textAnchor="middle" className="group-canvas__label">
          {group.name}
        </text>
      </svg>

      <div
        ref={setNodeRef}
        className={`group-canvas__drop ${isOver ? 'group-canvas__drop--over' : ''}`.trim()}
        aria-label={`Drop zone for ${group.name}`}
      />

      {items.map((item, i) => {
        const pos = ring[i] ?? { x: cx, y: cy }
        return (
          <div
            key={item.id}
            className="group-canvas__item-wrap"
            style={{
              left: `${(pos.x / CANVAS.width) * 100}%`,
              top: `${(pos.y / CANVAS.height) * 100}%`,
            }}
          >
            <ItemChip item={item} onOpen={onOpenItem} />
          </div>
        )
      })}
    </div>
  )
}
