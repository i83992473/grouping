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
import {
  DND_PALETTE_ID,
  GROUP_CIRCLE_LAYOUT,
  parseItemDragId,
} from './constants'
import { ItemModal } from './components/ItemModal'
import { MultiGroupCanvas } from './components/MultiGroupCanvas'
import { Palette } from './components/Palette'
import {
  directGroupIds,
  initials,
  itemTooltipWithGroups,
  layoutCanvasItemPositions,
} from './model'
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
  { id: 'g2', name: 'Design', parentGroupId: null },
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

function dragEndHitsPalette(event: DragEndEvent): boolean {
  if (event.over?.id === DND_PALETTE_ID) return true
  return (event.collisions ?? []).some((c) => c.id === DND_PALETTE_ID)
}

/** All group droppables the pointer intersects (Venn overlap adds every hit). */
function groupIdsFromDragEnd(event: DragEndEvent): string[] {
  const raw = (event.collisions ?? [])
    .map((c) => String(c.id))
    .filter((id) => id.startsWith('droppable-group:'))
    .map((id) => id.slice('droppable-group:'.length))
  if (raw.length > 0) return [...new Set(raw)]
  const oid = event.over ? String(event.over.id) : ''
  if (oid.startsWith('droppable-group:')) {
    return [oid.slice('droppable-group:'.length)]
  }
  return []
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

  const canvasGroupIdSet = useMemo(
    () =>
      new Set(
        groups
          .filter((g) => GROUP_CIRCLE_LAYOUT[g.id] != null)
          .map((g) => g.id),
      ),
    [groups],
  )

  const canvasGroups = useMemo(
    () => groups.filter((g) => GROUP_CIRCLE_LAYOUT[g.id] != null),
    [groups],
  )

  const itemsOnPalette = useMemo(
    () => items.filter((i) => directGroupIds(i.id, memberships).size === 0),
    [items, memberships],
  )

  const itemsOnCanvas = useMemo(
    () =>
      items.filter((i) => {
        const d = directGroupIds(i.id, memberships)
        return [...d].some((gid) => canvasGroupIdSet.has(gid))
      }),
    [items, memberships, canvasGroupIdSet],
  )

  const itemPositions = useMemo(
    () =>
      layoutCanvasItemPositions(
        itemsOnCanvas,
        memberships,
        GROUP_CIRCLE_LAYOUT,
        canvasGroupIdSet,
      ),
    [itemsOnCanvas, memberships, canvasGroupIdSet],
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
    const { active } = event
    setActiveDragId(null)
    const itemId = parseItemDragId(active.id)
    if (!itemId) return

    if (dragEndHitsPalette(event)) {
      setMemberships((m) => clearAllMembershipsForItem(m, itemId))
      return
    }

    const groupIds = groupIdsFromDragEnd(event)
    if (groupIds.length === 0) return

    setMemberships((m) => {
      let next = m
      for (const gid of groupIds) {
        next = addMembership(next, itemId, gid)
      }
      return next
    })
  }

  const handleDragCancel = () => setActiveDragId(null)

  const tooltipForItem = (item: Item) =>
    itemTooltipWithGroups(item, groups, memberships)

  const directCountOnCanvas = (item: Item) =>
    [...directGroupIds(item.id, memberships)].filter((id) =>
      canvasGroupIdSet.has(id),
    ).length

  return (
    <div className={`app${activeDragId ? ' dnd-active' : ''}`.trim()}>
      <header className="app__header">
        <h1>Grouping</h1>
        <p className="app__sub">
          Drag chips into one or both circles (overlap adds both groups), or
          onto Ungrouped to clear. Click a chip for details. A short drag
          threshold separates click from drag.
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
          <MultiGroupCanvas
            canvasGroups={canvasGroups}
            layouts={GROUP_CIRCLE_LAYOUT}
            items={itemsOnCanvas}
            itemPositions={itemPositions}
            tooltipForItem={tooltipForItem}
            directCountOnCanvas={directCountOnCanvas}
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
