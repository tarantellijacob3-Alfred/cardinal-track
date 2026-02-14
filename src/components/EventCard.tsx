import type { TrackEvent, MeetEntryWithDetails } from '../types/database'

interface Props {
  event: TrackEvent
  entries: MeetEntryWithDetails[]
  isCoach: boolean
  isActive?: boolean
  onToggleActive?: (eventId: string) => void
  onAssign?: () => void
  onRemoveEntry?: (entryId: string) => void
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

export default function EventCard({ event, entries, isCoach, isActive = true, onToggleActive, onAssign, onRemoveEntry }: Props) {
  const colorClass = categoryColors[event.category] || categoryColors.Other
  const badgeClass = categoryBadge[event.category] || categoryBadge.Other

  return (
    <div className={`card border-l-4 ${colorClass} ${!isActive ? 'opacity-50' : ''}`}>
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

      {entries.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No athletes assigned</p>
      ) : (
        <div className="space-y-1">
          {entries
            .sort((a, b) => (a.relay_leg ?? 99) - (b.relay_leg ?? 99))
            .map((entry, idx) => (
            <div key={entry.id} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-white/50 group">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-gray-400 w-5">
                  {event.is_relay && entry.relay_leg ? `L${entry.relay_leg}` : `${idx + 1}.`}
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
              {isCoach && onRemoveEntry && (
                <button
                  onClick={() => onRemoveEntry(entry.id)}
                  className="sm:opacity-0 sm:group-hover:opacity-100 p-2 text-cardinal-500 hover:text-cardinal-700 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="Remove"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
