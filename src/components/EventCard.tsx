import type { TrackEvent, MeetEntryWithDetails } from '../types/database'

interface Props {
  event: TrackEvent
  entries: MeetEntryWithDetails[]
  isCoach: boolean
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

export default function EventCard({ event, entries, isCoach, onAssign, onRemoveEntry }: Props) {
  const colorClass = categoryColors[event.category] || categoryColors.Other
  const badgeClass = categoryBadge[event.category] || categoryBadge.Other

  return (
    <div className={`card border-l-4 ${colorClass}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-navy-900">{event.name}</h3>
          <span className={badgeClass}>{event.category}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {entries.length}/{event.max_entries}
          </span>
          {isCoach && onAssign && (
            <button
              onClick={onAssign}
              className="p-1.5 rounded-lg bg-navy-800 text-white hover:bg-navy-700 transition-colors"
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
                  className="opacity-0 group-hover:opacity-100 p-1 text-cardinal-500 hover:text-cardinal-700 transition-all"
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
