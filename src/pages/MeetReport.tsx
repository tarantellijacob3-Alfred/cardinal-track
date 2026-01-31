import { useParams, Link } from 'react-router-dom'
import { useMeet } from '../hooks/useMeets'
import { useEvents } from '../hooks/useEvents'
import { useMeetEntries } from '../hooks/useMeetEntries'
import type { MeetEntryWithDetails } from '../types/database'

interface AthleteRow {
  id: string
  name: string
  grade: number | null
  level: 'JV' | 'Varsity'
  gender: 'Boys' | 'Girls'
  events: { name: string; shortName: string; category: string; isRelay: boolean; relayLeg: number | null; relayTeam: string | null }[]
}

export default function MeetReport() {
  const { id } = useParams<{ id: string }>()
  const { meet, loading: meetLoading } = useMeet(id)
  const { events, loading: eventsLoading } = useEvents()
  const { entries, loading: entriesLoading } = useMeetEntries(id)

  const loading = meetLoading || eventsLoading || entriesLoading

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-800" />
      </div>
    )
  }

  if (!meet) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-navy-900">Meet not found</h2>
        <Link to="/meets" className="btn-primary inline-block mt-4">Back to Meets</Link>
      </div>
    )
  }

  const meetDate = new Date(meet.date + 'T00:00:00')

  // Group entries by athlete
  const athleteMap = new Map<string, AthleteRow>()

  entries.forEach((entry: MeetEntryWithDetails) => {
    const athlete = entry.athletes
    const event = entry.events

    if (!athleteMap.has(athlete.id)) {
      athleteMap.set(athlete.id, {
        id: athlete.id,
        name: `${athlete.last_name}, ${athlete.first_name}`,
        grade: athlete.grade,
        level: athlete.level,
        gender: athlete.gender,
        events: [],
      })
    }

    athleteMap.get(athlete.id)!.events.push({
      name: event.name,
      shortName: event.short_name,
      category: event.category,
      isRelay: event.is_relay,
      relayLeg: entry.relay_leg,
      relayTeam: entry.relay_team,
    })
  })

  // Sort athletes alphabetically
  const athletes = Array.from(athleteMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  )

  // Category color badges
  const categoryColor: Record<string, string> = {
    Field: 'bg-green-100 text-green-800',
    Sprint: 'bg-blue-100 text-blue-800',
    Distance: 'bg-purple-100 text-purple-800',
    Hurdles: 'bg-orange-100 text-orange-800',
    Relay: 'bg-yellow-100 text-yellow-800',
    Other: 'bg-gray-100 text-gray-700',
  }

  const handlePrint = () => window.print()

  return (
    <div className="space-y-6">
      {/* Screen header */}
      <div className="no-print">
        <Link to={`/meets/${id}`} className="text-sm text-navy-600 hover:text-navy-800 font-medium mb-2 inline-block">
          ← Back to Meet
        </Link>

        <div className="bg-gradient-to-br from-navy-800 to-navy-950 rounded-2xl p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{meet.name}</h1>
              <p className="text-sm text-gray-300 mt-1">Athlete / Event Report</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-300">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {meetDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
                {meet.location && (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {meet.location}
                  </span>
                )}
                <span className="bg-navy-700 px-2 py-0.5 rounded text-xs">{meet.level}</span>
              </div>
            </div>

            <button onClick={handlePrint} className="btn-ghost text-white hover:bg-navy-700 text-sm">
              <svg className="w-4 h-4 mr-1.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Report
            </button>
          </div>

          {/* Summary stats */}
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="bg-navy-700/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gold-400">{athletes.length}</p>
              <p className="text-xs text-gray-300">Athletes</p>
            </div>
            <div className="bg-navy-700/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gold-400">{entries.length}</p>
              <p className="text-xs text-gray-300">Total Entries</p>
            </div>
            <div className="bg-navy-700/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gold-400">
                {new Set(entries.map(e => e.event_id)).size}
              </p>
              <p className="text-xs text-gray-300">Events</p>
            </div>
          </div>
        </div>
      </div>

      {/* Athlete list - screen */}
      {athletes.length === 0 ? (
        <div className="card text-center py-8 text-gray-500">
          <p className="text-lg font-medium">No athletes registered</p>
          <p className="text-sm mt-1">Assign athletes to events from the meet detail page.</p>
        </div>
      ) : (
        <div className="space-y-3 no-print">
          {athletes.map((athlete) => (
            <div key={athlete.id} className="card">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <Link
                    to={`/athletes/${athlete.id}`}
                    className="text-lg font-semibold text-navy-900 hover:text-navy-700"
                  >
                    {athlete.name}
                  </Link>
                  <div className="flex items-center gap-2 mt-0.5">
                    {athlete.grade && (
                      <span className="text-xs text-gray-500">Grade {athlete.grade}</span>
                    )}
                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                      {athlete.level}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                      {athlete.gender}
                    </span>
                  </div>
                </div>
                <span className="text-sm text-gray-500 font-medium">
                  {athlete.events.length} event{athlete.events.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {athlete.events
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((ev, idx) => (
                    <span
                      key={idx}
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${categoryColor[ev.category] || categoryColor.Other}`}
                    >
                      {ev.shortName || ev.name}
                      {ev.isRelay && ev.relayLeg ? ` (Leg ${ev.relayLeg})` : ''}
                      {ev.isRelay && ev.relayTeam ? ` ${ev.relayTeam}` : ''}
                    </span>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Print version */}
      <div className="print-only bg-white p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">{meet.name}</h1>
          <p className="text-sm text-gray-500">Athlete / Event Report</p>
          <p className="text-gray-600">
            {meetDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            {meet.location && ` — ${meet.location}`}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {athletes.length} athletes · {entries.length} entries · {meet.level} Level
          </p>
        </div>

        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-2 pr-4 font-bold">Athlete</th>
              <th className="text-left py-2 pr-4 font-bold">Gr</th>
              <th className="text-left py-2 pr-4 font-bold">Level</th>
              <th className="text-left py-2 font-bold">Events</th>
              <th className="text-right py-2 font-bold">#</th>
            </tr>
          </thead>
          <tbody>
            {athletes.map((athlete) => (
              <tr key={athlete.id} className="border-b border-gray-200">
                <td className="py-1.5 pr-4 font-medium">{athlete.name}</td>
                <td className="py-1.5 pr-4">{athlete.grade ?? '—'}</td>
                <td className="py-1.5 pr-4">{athlete.level}</td>
                <td className="py-1.5">
                  {athlete.events
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(ev => {
                      let label = ev.shortName || ev.name
                      if (ev.isRelay && ev.relayLeg) label += ` (L${ev.relayLeg})`
                      if (ev.isRelay && ev.relayTeam) label += ` ${ev.relayTeam}`
                      return label
                    })
                    .join(', ')}
                </td>
                <td className="py-1.5 text-right">{athlete.events.length}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 text-center text-xs text-gray-400">
          Cardinal Track — Bishop Snyder Track &amp; Field — Printed {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  )
}
