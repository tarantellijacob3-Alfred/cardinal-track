import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useMeet } from '../hooks/useMeets'
import { useEvents } from '../hooks/useEvents'
import { useAthletes } from '../hooks/useAthletes'
import { useMeetEntries } from '../hooks/useMeetEntries'
import EventCard from '../components/EventCard'
import AthleteAssignModal from '../components/AthleteAssignModal'
import PrintMeetSheet from '../components/PrintMeetSheet'
import type { TrackEvent } from '../types/database'

export default function MeetDetail() {
  const { id } = useParams<{ id: string }>()
  const { isCoach } = useAuth()
  const { meet, loading: meetLoading } = useMeet(id)
  const { events, loading: eventsLoading } = useEvents()
  const { athletes } = useAthletes()
  const {
    entries, loading: entriesLoading,
    addEntry, removeEntry,
    getEntriesByEvent, getAthleteEventCount
  } = useMeetEntries(id)

  const [assigningEvent, setAssigningEvent] = useState<TrackEvent | null>(null)
  const [relaysCountTowardLimit, setRelaysCountTowardLimit] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

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

  const categories = ['Field', 'Sprint', 'Distance', 'Hurdles', 'Relay', 'Other']
  const filteredEvents = activeCategory
    ? events.filter(e => e.category === activeCategory)
    : events

  const handleAssign = async (athleteId: string, relayLeg?: number, relayTeam?: string) => {
    if (!assigningEvent || !id) return

    const count = getAthleteEventCount(athleteId, !relaysCountTowardLimit)
    if (count >= 4 && !assigningEvent.is_relay) {
      alert('This athlete already has 4 events!')
      return
    }

    await addEntry({
      meet_id: id,
      athlete_id: athleteId,
      event_id: assigningEvent.id,
      relay_leg: relayLeg ?? null,
      relay_team: (relayTeam as 'A' | 'Alt') ?? null,
    })
  }

  const handleRemoveEntry = async (entryId: string) => {
    await removeEntry(entryId)
  }

  const handlePrint = () => {
    window.print()
  }

  // Count unique athletes in this meet
  const uniqueAthletes = new Set(entries.map(e => e.athlete_id)).size

  return (
    <div className="space-y-6">
      {/* Print-only sheet */}
      <PrintMeetSheet meet={meet} events={events} entries={entries} />

      {/* Header */}
      <div className="no-print">
        <Link to="/meets" className="text-sm text-navy-600 hover:text-navy-800 font-medium mb-2 inline-block">
          ← Back to Meets
        </Link>

        <div className="bg-gradient-to-br from-navy-800 to-navy-950 rounded-2xl p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{meet.name}</h1>
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

            <div className="flex flex-wrap gap-2">
              <button onClick={handlePrint} className="btn-ghost text-white hover:bg-navy-700 text-sm">
                <svg className="w-4 h-4 mr-1.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="bg-navy-700/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gold-400">{entries.length}</p>
              <p className="text-xs text-gray-300">Entries</p>
            </div>
            <div className="bg-navy-700/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gold-400">{uniqueAthletes}</p>
              <p className="text-xs text-gray-300">Athletes</p>
            </div>
            <div className="bg-navy-700/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gold-400">
                {events.filter(e => getEntriesByEvent(e.id).length > 0).length}
              </p>
              <p className="text-xs text-gray-300">Events</p>
            </div>
          </div>

          {meet.notes && (
            <p className="mt-3 text-sm text-gray-300 border-t border-navy-700 pt-3">{meet.notes}</p>
          )}
        </div>
      </div>

      {/* Coach settings */}
      {isCoach && (
        <div className="no-print flex items-center justify-between bg-gold-50 rounded-lg p-3 border border-gold-200">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={relaysCountTowardLimit}
              onChange={e => setRelaysCountTowardLimit(e.target.checked)}
              className="rounded border-gray-300 text-navy-800 focus:ring-navy-500"
            />
            <span className="text-navy-800">Count relays toward 4-event limit</span>
          </label>
        </div>
      )}

      {/* Category filters */}
      <div className="no-print flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !activeCategory ? 'bg-navy-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All Events
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat ? 'bg-navy-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Event cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 no-print">
        {filteredEvents.map(event => (
          <EventCard
            key={event.id}
            event={event}
            entries={getEntriesByEvent(event.id)}
            isCoach={isCoach}
            onAssign={() => setAssigningEvent(event)}
            onRemoveEntry={handleRemoveEntry}
          />
        ))}
      </div>

      {/* Assign modal */}
      {assigningEvent && (
        <AthleteAssignModal
          event={assigningEvent}
          athletes={athletes}
          entries={getEntriesByEvent(assigningEvent.id)}
          allEntries={entries}
          relaysCountTowardLimit={relaysCountTowardLimit}
          onAssign={handleAssign}
          onClose={() => setAssigningEvent(null)}
        />
      )}
    </div>
  )
}
