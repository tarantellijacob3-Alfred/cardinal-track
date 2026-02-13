import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useMeet } from '../hooks/useMeets'
import { useEvents } from '../hooks/useEvents'
import { useMeetEntries } from '../hooks/useMeetEntries'
import { useTeam, useTeamPath } from '../hooks/useTeam'
import TFRRSLink from '../components/TFRRSLink'
import type { MeetEntryWithDetails } from '../types/database'

interface AthleteRow {
  id: string
  name: string
  firstName: string
  lastName: string
  grade: number | null
  level: 'JV' | 'Varsity'
  gender: 'Boys' | 'Girls'
  tfrrsUrl: string | null
  events: { name: string; shortName: string; category: string; isRelay: boolean; relayLeg: number | null; relayTeam: string | null }[]
}

const categoryColor: Record<string, string> = {
  Field: 'bg-green-100 text-green-800',
  Sprint: 'bg-blue-100 text-blue-800',
  Distance: 'bg-purple-100 text-purple-800',
  Hurdles: 'bg-orange-100 text-orange-800',
  Relay: 'bg-yellow-100 text-yellow-800',
  Other: 'bg-gray-100 text-gray-700',
}

const OVER_LIMIT = 4

export default function MeetReport() {
  const { id } = useParams<{ id: string }>()
  const { meet, loading: meetLoading } = useMeet(id)
  const { events, loading: eventsLoading } = useEvents()
  const { entries, loading: entriesLoading } = useMeetEntries(id)
  const { team } = useTeam()
  const teamPath = useTeamPath()
  const [filterGender, setFilterGender] = useState<'all' | 'Boys' | 'Girls'>('all')
  const [filterLevel, setFilterLevel] = useState<'all' | 'JV' | 'Varsity'>('all')

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
        <Link to={teamPath('/meets')} className="btn-primary inline-block mt-4">Back to Meets</Link>
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
        firstName: athlete.first_name,
        lastName: athlete.last_name,
        grade: athlete.grade,
        level: athlete.level,
        gender: athlete.gender,
        tfrrsUrl: athlete.tfrrs_url || null,
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

  // Sort athletes alphabetically, apply filters
  let athletes = Array.from(athleteMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  )

  if (filterGender !== 'all') {
    athletes = athletes.filter(a => a.gender === filterGender)
  }
  if (filterLevel !== 'all') {
    athletes = athletes.filter(a => a.level === filterLevel)
  }

  // Stats
  const overLimitCount = athletes.filter(a => a.events.length > OVER_LIMIT).length

  const handlePrint = () => window.print()
  const schoolName = team?.school_name || 'Bishop Snyder'

  return (
    <div className="space-y-6">
      {/* Screen header */}
      <div className="no-print">
        <Link to={teamPath(`/meets/${id}`)} className="text-sm text-navy-600 hover:text-navy-800 font-medium mb-2 inline-flex items-center min-h-[44px]">
          ← Back to Meet
        </Link>

        <div className="bg-gradient-to-br from-navy-800 to-navy-950 rounded-2xl p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{meet.name}</h1>
              <p className="text-sm text-gray-300 mt-1">Meet Roster</p>
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

            <button onClick={handlePrint} className="btn-ghost text-white hover:bg-navy-700 text-sm min-h-[44px]">
              <svg className="w-4 h-4 mr-1.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Report
            </button>
          </div>

          {/* Summary stats */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
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
            {overLimitCount > 0 && (
              <div className="bg-red-500/30 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-red-300">{overLimitCount}</p>
                <p className="text-xs text-red-200">Over 4 Events</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="no-print flex flex-wrap gap-3">
        <div className="flex gap-1">
          {(['all', 'Boys', 'Girls'] as const).map(g => (
            <button
              key={g}
              onClick={() => setFilterGender(g)}
              className={`px-3 py-2 rounded-full text-sm font-medium transition-colors min-h-[44px] ${
                filterGender === g ? 'bg-navy-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {g === 'all' ? 'All' : g}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {(['all', 'JV', 'Varsity'] as const).map(l => (
            <button
              key={l}
              onClick={() => setFilterLevel(l)}
              className={`px-3 py-2 rounded-full text-sm font-medium transition-colors min-h-[44px] ${
                filterLevel === l ? 'bg-navy-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {l === 'all' ? 'All' : l}
            </button>
          ))}
        </div>
      </div>

      {/* Athlete list - screen (card layout, mobile-friendly) */}
      {athletes.length === 0 ? (
        <div className="card text-center py-8 text-gray-500">
          <p className="text-lg font-medium">No athletes registered</p>
          <p className="text-sm mt-1">Assign athletes to events from the meet detail page.</p>
        </div>
      ) : (
        <div className="space-y-3 no-print">
          {athletes.map((athlete) => {
            const sortedEvents = [...athlete.events].sort((a, b) => a.name.localeCompare(b.name))

            return (
              <div key={athlete.id} className="card">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to={teamPath(`/athletes/${athlete.id}`)}
                        className="text-lg font-semibold text-navy-900 hover:text-navy-700"
                      >
                        {athlete.name}
                      </Link>
                      {athlete.tfrrsUrl && (
                        <TFRRSLink url={athlete.tfrrsUrl} />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
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
                  <span className={`text-sm font-medium ${
                    athlete.events.length > OVER_LIMIT ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {athlete.events.length} event{athlete.events.length !== 1 ? 's' : ''}
                    {athlete.events.length > OVER_LIMIT && ' ⚠️'}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {sortedEvents.map((ev, idx) => {
                    const isOverLimit = idx >= OVER_LIMIT
                    const baseColor = isOverLimit
                      ? 'bg-red-100 text-red-700 border border-red-300'
                      : categoryColor[ev.category] || categoryColor.Other

                    return (
                      <span
                        key={idx}
                        className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ${baseColor}`}
                      >
                        {ev.shortName || ev.name}
                        {ev.isRelay && ev.relayLeg ? ` (Leg ${ev.relayLeg})` : ''}
                        {ev.isRelay && ev.relayTeam ? ` ${ev.relayTeam}` : ''}
                      </span>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Print version */}
      <div className="print-only bg-white p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">{meet.name}</h1>
          <p className="text-sm text-gray-500">Meet Roster</p>
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
            {athletes.map((athlete) => {
              const sortedEvents = [...athlete.events].sort((a, b) => a.name.localeCompare(b.name))
              const isOver = athlete.events.length > OVER_LIMIT

              return (
                <tr key={athlete.id} className={`border-b border-gray-200 ${isOver ? 'bg-red-50' : ''}`}>
                  <td className="py-1.5 pr-4 font-medium">{athlete.name}</td>
                  <td className="py-1.5 pr-4">{athlete.grade ?? '—'}</td>
                  <td className="py-1.5 pr-4">{athlete.level}</td>
                  <td className="py-1.5">
                    {sortedEvents.map((ev, idx) => {
                      let label = ev.shortName || ev.name
                      if (ev.isRelay && ev.relayLeg) label += ` (L${ev.relayLeg})`
                      if (ev.isRelay && ev.relayTeam) label += ` ${ev.relayTeam}`
                      const over = idx >= OVER_LIMIT
                      return (
                        <span key={idx}>
                          {idx > 0 && ', '}
                          <span className={over ? 'font-bold text-red-600' : ''}>{label}</span>
                        </span>
                      )
                    })}
                  </td>
                  <td className={`py-1.5 text-right ${isOver ? 'font-bold text-red-600' : ''}`}>
                    {athlete.events.length}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="mt-6 text-center text-xs text-gray-400">
          TrackBoard — {schoolName} Track &amp; Field — Printed {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  )
}
