import { useDroppable } from '@dnd-kit/core'
import { DND_PALETTE_ID } from '../constants'
import { ItemChip } from './ItemChip'
import type { Item } from '../types'

type Props = {
  items: Item[]
  onOpenItem: (item: Item) => void
}

export function Palette({ items, onOpenItem }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: DND_PALETTE_ID })

  return (
    <div
      ref={setNodeRef}
      className={`palette ${isOver ? 'palette--over' : ''}`.trim()}
      aria-label="Ungrouped items"
    >
      <div className="palette__header">Ungrouped</div>
      <div className="palette__chips">
        {items.length === 0 ? (
          <p className="palette__empty">Drop items here to remove from groups</p>
        ) : (
          items.map((item) => (
            <ItemChip key={item.id} item={item} onOpen={onOpenItem} />
          ))
        )}
      </div>
    </div>
  )
}
