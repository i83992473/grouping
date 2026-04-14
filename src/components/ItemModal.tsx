import { useEffect, useState } from 'react'
import type { Group, Item, Membership } from '../types'

type Props = {
  item: Item
  groups: Group[]
  memberships: Membership[]
  onSave: (patch: Partial<Pick<Item, 'title' | 'description'>>) => void
  onClose: () => void
  onRemoveMembership: (groupId: string) => void
}

export function ItemModal({
  item,
  groups,
  memberships,
  onSave,
  onClose,
  onRemoveMembership,
}: Props) {
  const [title, setTitle] = useState(item.title)
  const [description, setDescription] = useState(item.description)

  useEffect(() => {
    setTitle(item.title)
    setDescription(item.description)
  }, [item])

  const directForItem = memberships.filter((m) => m.itemId === item.id)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="item-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal__header">
          <h2 id="item-modal-title">Item details</h2>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>
        <form
          className="modal__form"
          onSubmit={(e) => {
            e.preventDefault()
            onSave({ title: title.trim(), description: description.trim() })
            onClose()
          }}
        >
          <label className="modal__field">
            <span>Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </label>
          <label className="modal__field">
            <span>Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </label>
          <div className="modal__field">
            <span>Direct groups</span>
            <div className="modal__chips">
              {directForItem.length === 0 ? (
                <span className="modal__muted">None — drag onto a group to assign</span>
              ) : (
                directForItem.map((m) => {
                  const g = groups.find((x) => x.id === m.groupId)
                  return (
                    <span key={m.groupId} className="membership-chip">
                      {g?.name ?? m.groupId}
                      <button
                        type="button"
                        className="membership-chip__x"
                        onClick={() => onRemoveMembership(m.groupId)}
                        aria-label={`Remove from ${g?.name ?? 'group'}`}
                      >
                        ×
                      </button>
                    </span>
                  )
                })
              )}
            </div>
          </div>
          <div className="modal__actions">
            <button type="button" className="button button--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button button--primary">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
