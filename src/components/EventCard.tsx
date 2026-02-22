import { useEffect, useRef } from 'react'
import type { TrackEvent, MeetEntryWithDetails } from '../types/database'
import { useDragDrop } from '../contexts/DragDropContext'
import { useLongPressDrag } from '../hooks/useLongPressDrag'

interface Props {
  event: TrackEvent
  entries: MeetEntryWithDetails[]
  isCoach: boolean
  isActive?: boolean
  onToggleActive?: (eventId: string) => void
  onAssign?: () => void
  onRemoveEntry?: (entryId: string) => void
  onMoveEntry?: (entryId: string, fromEventId: string, toEventId: string) => void
}

const categoryColors: Record<string, string> = {
  Field: 'border-l-green-500 bg-green-50',
  Sprint: 'border-l-blue-500 bg-blue-50',
  Distance: 'border-l-purple-500 bg-purple-50',
  Hurdles: 'border-l-orange-500 bg-orange-50',
  Relay: 'border-l-pink-500 bg-pink-50',
  Other: 'border-l-gray-500 bg-gray-50',
}

const categoryBadge: Record<string, string> = {
  Field: 'badge-field',
  Sprint: 'badge-sprint',
  Distance: 'badge-distance',
  Hurdles: 'badge-hurdles',
  Relay: 'badge-relay',
  Other: 'badge-other',
}

/* Draggable athlete row */
function DraggableAthleteRow({
  entry,
  event,
  index,
  isCoach,
  onRemoveEntry,
}: {
  entry: MeetEntryWithDetails
  event: TrackEvent
  index: number
  isCoach: boolean
  onRemoveEntry?: (entryId: string) => void
}) {
  const { state, startDrag, updateDragPosition, endDrag } = useDragDrop()
  
  const { isLongPressing, handlers } = useLongPressDrag(entry, {
    disabled: !isCoach,
    longPressDelay: 400,
    onDragStart: () => {
      startDrag(entry, event.id)
    },
    onDragMove: (pos) => {
      updateDragPosition(pos)
    },
    onDragEnd: () => {
      endDrag()
    },
  })

  const isDraggingThis = state.isDragging && state.draggedEntry?.id === entry.id

  return (
    <div
      {...handlers}
      className={`flex items-center justify-between py-1.5 px-2 rounded-md group select-none touch-none transition-all ${
        isDraggingThis
          ? 'opacity-30 bg-navy-100'
          : isLongPressing
          ? 'bg-navy-100 scale-105 shadow-md'
          : 'hover:bg-white/50'
      }`}
      style={{ touchAction: 'none' }}
    >
      <div className="flex items-center space-x-2">
        <span className="text-xs font-medium text-gray-400 w-5">
          {event.is_relay && entry.relay_leg ? `L${entry.relay_leg}` : `${index + 1}.`}
        </span>
        <span className="text-sm font-medium text-navy-800">
          {entry.athletes.last_name}, {entry.athletes.first_name}
        </span>
        {event.is_relay && entry.relay_team && (
          <span className="text-xs bg-navy-100 text-navy-600 px-1.5 py-0.5 rounded">
            {entry.relay_team}
          </span>
        )}
      </div>
      {isCoach && onRemoveEntry && !state.isDragging && (
        <button
          onClick={() => onRemoveEntry(entry.id)}
          className="sm:opacity-0 sm:group-hover:opacity-100 p-2 text-red-500 hover:text-red-700 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
          title="Remove"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      {isCoach && !state.isDragging && (
        <div className="hidden sm:flex items-center text-xs text-gray-400 mr-2">
          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
          Hold to drag
        </div>
      )}
    </div>
  )
}

export default function EventCard({
  event,
  entries,
  isCoach,
  isActive = true,
  onToggleActive,
  onAssign,
  onRemoveEntry,
  onMoveEntry,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const { state, registerDropZone, unregisterDropZone, endDrag } = useDragDrop()
  
  const colorClass = categoryColors[event.category] || categoryColors.Other
  const badgeClass = categoryBadge[event.category] || categoryBadge.Other

  // Is this card being hovered during drag?
  const isDropTarget = state.isDragging && state.hoverEventId === event.id
  const isSourceCard = state.isDragging && state.sourceEventId === event.id

  // Register this card as a drop zone
  useEffect(() => {
    if (!cardRef.current || !isCoach) return
    
    registerDropZone(event.id, cardRef.current)
    return () => unregisterDropZone(event.id)
  }, [event.id, isCoach, registerDropZone, unregisterDropZone])

  // Handle drop on this card
  useEffect(() => {
    if (!isDropTarget || !onMoveEntry) return

    const handleTouchEnd = () => {
      const result = endDrag()
      if (result && result.targetEventId === event.id) {
        onMoveEntry(result.entry.id, result.entry.event_id, event.id)
      }
    }

    window.addEventListener('touchend', handleTouchEnd)
    return () => window.removeEventListener('touchend', handleTouchEnd)
  }, [isDropTarget, endDrag, event.id, onMoveEntry])

  return (
    <div
      ref={cardRef}
      className={`card border-l-4 transition-all ${colorClass} ${
        !isActive ? 'opacity-50' : ''
      } ${
        isDropTarget
          ? 'ring-2 ring-brand-400 ring-offset-2 scale-[1.02] shadow-lg bg-brand-50'
          : ''
      } ${
        isSourceCard ? 'opacity-70' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isCoach && onToggleActive && (
            <button
              onClick={() => onToggleActive(event.id)}
              className={`relative w-10 h-6 rounded-full transition-colors ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}
              title={isActive ? 'Deactivate event for this meet' : 'Activate event for this meet'}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isActive ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          )}
          <div>
            <h3 className={`font-semibold ${isActive ? 'text-navy-900' : 'text-gray-400 line-through'}`}>{event.name}</h3>
            <span className={badgeClass}>{event.category}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {entries.length} entered
          </span>
          {isCoach && isActive && onAssign && (
            <button
              onClick={onAssign}
              className="p-2 rounded-lg bg-navy-800 text-white hover:bg-navy-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Add athlete"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Drop zone hint when dragging */}
      {state.isDragging && !isSourceCard && (
        <div className={`mb-2 py-2 px-3 rounded-lg border-2 border-dashed text-center text-sm transition-all ${
          isDropTarget
            ? 'border-brand-400 bg-brand-100 text-brand-700'
            : 'border-gray-300 bg-gray-50 text-gray-400'
        }`}>
          {isDropTarget ? '↓ Drop here to move' : 'Drag athlete here'}
        </div>
      )}

      {entries.length === 0 && !state.isDragging ? (
        <p className="text-sm text-gray-400 italic">No athletes assigned</p>
      ) : (
        <div className="space-y-1">
          {entries
            .sort((a, b) => (a.relay_leg ?? 99) - (b.relay_leg ?? 99))
            .map((entry, idx) => (
              <DraggableAthleteRow
                key={entry.id}
                entry={entry}
                event={event}
                index={idx}
                isCoach={isCoach}
                onRemoveEntry={onRemoveEntry}
              />
            ))}
        </div>
      )}
    </div>
  )
}
