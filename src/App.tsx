import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useMemo, useState } from 'react'
import { DND_PALETTE_ID, parseItemDragId } from './constants'
import { GroupCanvas } from './components/GroupCanvas'
import { ItemModal } from './components/ItemModal'
import { Palette } from './components/Palette'
import { directGroupIds, initials } from './model'
import type { Group, Item, Membership } from './types'
import './App.css'

const seedItems: Item[] = [
  { id: 'i1', title: 'Alice Carter', description: 'Product lead' },
  { id: 'i2', title: 'Bob Okonjo', description: 'Engineer' },
  { id: 'i3', title: 'Chen Wei', description: 'Design' },
  { id: 'i4', title: 'Dana Singh', description: 'QA' },
]

const seedGroups: Group[] = [
  { id: 'g1', name: 'Core team', parentGroupId: null },
]

function addMembership(
  memberships: Membership[],
  itemId: string,
  groupId: string,
): Membership[] {
  if (memberships.some((m) => m.itemId === itemId && m.groupId === groupId)) {
    return memberships
  }
  return [...memberships, { itemId, groupId }]
}

function removeMembership(
  memberships: Membership[],
  itemId: string,
  groupId: string,
): Membership[] {
  return memberships.filter(
    (m) => !(m.itemId === itemId && m.groupId === groupId),
  )
}

function clearAllMembershipsForItem(
  memberships: Membership[],
  itemId: string,
): Membership[] {
  return memberships.filter((m) => m.itemId !== itemId)
}

export default function App() {
  const [items, setItems] = useState<Item[]>(seedItems)
  const [groups] = useState<Group[]>(seedGroups)
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [modalItem, setModalItem] = useState<Item | null>(null)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const primaryGroup = groups[0]
  if (!primaryGroup) {
    throw new Error('Expected at least one group')
  }

  const itemsOnPalette = useMemo(
    () => items.filter((i) => directGroupIds(i.id, memberships).size === 0),
    [items, memberships],
  )

  const itemsInPrimary = useMemo(
    () =>
      items.filter((i) =>
        directGroupIds(i.id, memberships).has(primaryGroup.id),
      ),
    [items, memberships, primaryGroup.id],
  )

  const activeDraggingItem = useMemo(() => {
    if (!activeDragId) return null
    const itemId = parseItemDragId(activeDragId)
    if (!itemId) return null
    return items.find((i) => i.id === itemId) ?? null
  }, [activeDragId, items])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveDragId(null)
    const itemId = parseItemDragId(active.id)
    if (!itemId) return

    if (!over) return

    if (over.id === DND_PALETTE_ID) {
      setMemberships((m) => clearAllMembershipsForItem(m, itemId))
      return
    }

    const overStr = String(over.id)
    if (overStr.startsWith('droppable-group:')) {
      const gid = overStr.slice('droppable-group:'.length)
      setMemberships((m) => addMembership(m, itemId, gid))
    }
  }

  const handleDragCancel = () => setActiveDragId(null)

  return (
    <div className={`app${activeDragId ? ' dnd-active' : ''}`.trim()}>
      <header className="app__header">
        <h1>Grouping</h1>
        <p className="app__sub">
          Drag chips into the team circle or onto Ungrouped. Click a chip for
          details. A short drag threshold separates click from drag.
        </p>
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="app__workspace">
          <GroupCanvas
            group={primaryGroup}
            items={itemsInPrimary}
            onOpenItem={setModalItem}
          />
          <Palette items={itemsOnPalette} onOpenItem={setModalItem} />
        </div>

        <DragOverlay dropAnimation={null}>
          {activeDraggingItem ? (
            <div className="item-chip item-chip--overlay" aria-hidden>
              <span className="item-chip__initials">
                {initials(activeDraggingItem.title)}
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {modalItem ? (
        <ItemModal
          item={modalItem}
          groups={groups}
          memberships={memberships}
          onSave={(patch) =>
            setItems((prev) =>
              prev.map((i) =>
                i.id === modalItem.id ? { ...i, ...patch } : i,
              ),
            )
          }
          onClose={() => setModalItem(null)}
          onRemoveMembership={(groupId) =>
            setMemberships((m) => removeMembership(m, modalItem.id, groupId))
          }
        />
      ) : null}
    </div>
  )
}
