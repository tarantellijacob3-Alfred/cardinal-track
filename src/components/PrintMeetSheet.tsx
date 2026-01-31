import type { Meet, TrackEvent, MeetEntryWithDetails } from '../types/database'

interface Props {
  meet: Meet
  events: TrackEvent[]
  entries: MeetEntryWithDetails[]
}

export default function PrintMeetSheet({ meet, events, entries }: Props) {
  const meetDate = new Date(meet.date + 'T00:00:00')

  const getEntriesForEvent = (eventId: string) =>
    entries
      .filter(e => e.event_id === eventId)
      .sort((a, b) => (a.relay_leg ?? 99) - (b.relay_leg ?? 99))

  const eventsWithEntries = events.filter(ev => getEntriesForEvent(ev.id).length > 0)

  return (
    <div className="print-only bg-white p-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">{meet.name}</h1>
        <p className="text-gray-600">
          {meetDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          {meet.location && ` — ${meet.location}`}
        </p>
        <p className="text-sm text-gray-500 mt-1">{meet.level} Level</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {eventsWithEntries.map(event => {
          const eventEntries = getEntriesForEvent(event.id)
          return (
            <div key={event.id} className="border rounded p-3 break-inside-avoid">
              <h3 className="font-bold text-sm border-b pb-1 mb-2">
                {event.name} ({eventEntries.length})
              </h3>
              <ol className="text-sm space-y-0.5">
                {eventEntries.map((entry, idx) => (
                  <li key={entry.id} className="flex justify-between">
                    <span>
                      {event.is_relay && entry.relay_leg ? `Leg ${entry.relay_leg}: ` : `${idx + 1}. `}
                      {entry.athletes.last_name}, {entry.athletes.first_name}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )
        })}
      </div>

      <div className="mt-6 text-center text-xs text-gray-400">
        Cardinal Track — Bishop Snyder Track &amp; Field — Printed {new Date().toLocaleDateString()}
      </div>
    </div>
  )
}
