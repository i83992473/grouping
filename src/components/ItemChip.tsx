import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { DND_ITEM_PREFIX } from '../constants'
import { initials } from '../model'
import type { Item } from '../types'

type Props = {
  item: Item
  onOpen: (item: Item) => void
  style?: React.CSSProperties
  className?: string
}

export function ItemChip({ item, onOpen, style, className = '' }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `${DND_ITEM_PREFIX}${item.id}`,
  })

  const dragStyle: React.CSSProperties = {
    ...style,
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    zIndex: isDragging ? 20 : undefined,
  }

  return (
    <button
      type="button"
      ref={setNodeRef}
      className={`item-chip ${isDragging ? 'item-chip--dragging' : ''} ${className}`.trim()}
      style={dragStyle}
      title={item.title}
      onClick={() => onOpen(item)}
      {...listeners}
      {...attributes}
    >
      <span className="item-chip__initials">{initials(item.title)}</span>
    </button>
  )
}
