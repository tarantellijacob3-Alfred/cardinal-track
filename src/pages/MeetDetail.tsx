import { useState, useMemo, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useMeet, useMeets } from '../hooks/useMeets'
import { useEvents } from '../hooks/useEvents'
import { useAthletes } from '../hooks/useAthletes'
import { useMeetEntries } from '../hooks/useMeetEntries'
import EventCard from '../components/EventCard'
import AthleteAssignModal from '../components/AthleteAssignModal'
import PrintMeetSheet from '../components/PrintMeetSheet'
import type { TrackEvent, Meet, MeetEntryWithDetails } from '../types/database'
import { supabase } from '../lib/supabase'

type ViewMode = 'card' | 'grid'

/* ───── Category color map for grid cells ───── */
const categoryBg: Record<string, string> = {
  Field: 'bg-green-100',
  Sprint: 'bg-blue-100',
  Distance: 'bg-purple-100',
  Hurdles: 'bg-orange-100',
  Relay: 'bg-pink-100',
  Other: 'bg-gray-100',
}

const categoryBgActive: Record<string, string> = {
  Field: 'bg-green-500',
  Sprint: 'bg-blue-500',
  Distance: 'bg-purple-500',
  Hurdles: 'bg-orange-500',
  Relay: 'bg-pink-500',
  Other: 'bg-gray-500',
}

/* ───── Copy From Previous Meet Modal ───── */
interface CopyModalProps {
  currentMeetId: string
  meets: Meet[]
  entries: MeetEntryWithDetails[]
  onCopy: (sourceMeetId: string) => Promise<void>
  onClose: () => void
}

function CopyFromMeetModal({ currentMeetId, meets, entries, onCopy, onClose }: CopyModalProps) {
  const [copying, setCopying] = useState(false)
  const [selectedMeet, setSelectedMeet] = useState<string | null>(null)

  const otherMeets = meets.filter(m => m.id !== currentMeetId)

  const handleCopy = async () => {
    if (!selectedMeet) return
    setCopying(true)
    try {
      await onCopy(selectedMeet)
      onClose()
    } finally {
      setCopying(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold text-navy-900 text-lg">Copy from Previous Meet</h3>
            <p className="text-sm text-gray-500">Select a meet to copy all assignments from</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {otherMeets.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No other meets found</p>
          ) : (
            <div className="space-y-1">
              {otherMeets.map(m => {
                const d = new Date(m.date + 'T00:00:00')
                const isSelected = selectedMeet === m.id
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMeet(m.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-navy-50 ring-1 ring-navy-300'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <p className="font-medium text-sm text-navy-800">{m.name}</p>
                    <p className="text-xs text-gray-500">
                      {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {m.location ? ` · ${m.location}` : ''}
                      <span className="ml-2 bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{m.level}</span>
                    </p>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {selectedMeet && (
          <div className="border-t p-4 bg-gray-50 rounded-b-2xl flex justify-between items-center">
            <button onClick={onClose} className="btn-ghost text-sm">Cancel</button>
            <button
              onClick={handleCopy}
              disabled={copying}
              className="btn-primary text-sm flex items-center space-x-2"
            >
              {copying ? (
                <>
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>Copying...</span>
                </>
              ) : (
                <span>Copy Entries</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ───── Grid View ───── */
interface GridViewProps {
  athletes: { id: string; first_name: string; last_name: string; active: boolean }[]
  events: TrackEvent[]
  entries: MeetEntryWithDetails[]
  meetId: string
  isCoach: boolean
  relaysCountTowardLimit: boolean
  onToggle: (athleteId: string, eventId: string, isAssigned: boolean, entryId?: string) => void
}

function GridView({ athletes, events, entries, isCoach, relaysCountTowardLimit, onToggle }: GridViewProps) {
  // Build lookup: `${athleteId}:${eventId}` -> entry
  const entryMap = useMemo(() => {
    const m = new Map<string, MeetEntryWithDetails>()
    for (const e of entries) {
      m.set(`${e.athlete_id}:${e.event_id}`, e)
    }
    return m
  }, [entries])

  // Build athlete event counts (non-relay)
  const athleteCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const entry of entries) {
      if (!relaysCountTowardLimit && entry.events?.is_relay) continue
      counts[entry.athlete_id] = (counts[entry.athlete_id] || 0) + 1
    }
    return counts
  }, [entries, relaysCountTowardLimit])

  const activeAthletes = athletes
    .filter(a => a.active)
    .sort((a, b) => a.last_name.localeCompare(b.last_name) || a.first_name.localeCompare(b.first_name))

  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="border-b">
              <th className="sticky left-0 bg-white z-10 text-left px-3 py-2 font-semibold text-navy-800 min-w-[160px]">
                Athlete
              </th>
              <th className="sticky left-[160px] bg-white z-10 text-center px-1 py-2 font-semibold text-navy-800 min-w-[40px]">
                #
              </th>
              {events.map(ev => (
                <th
                  key={ev.id}
                  className={`text-center px-1 py-2 font-medium min-w-[44px] ${categoryBg[ev.category] || 'bg-gray-100'}`}
                  title={ev.name}
                >
                  <div className="truncate max-w-[44px]">{ev.short_name}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {activeAthletes.map(athlete => {
              const count = athleteCounts[athlete.id] || 0
              const atLimit = count >= 4
              return (
                <tr key={athlete.id} className="hover:bg-gray-50">
                  <td className="sticky left-0 bg-white z-10 px-3 py-1.5 font-medium text-navy-800 whitespace-nowrap border-r border-gray-100">
                    {athlete.last_name}, {athlete.first_name}
                  </td>
                  <td className={`sticky left-[160px] bg-white z-10 text-center py-1.5 font-bold border-r border-gray-100 ${
                    atLimit ? 'text-cardinal-600' : count >= 3 ? 'text-gold-600' : 'text-green-600'
                  }`}>
                    {count}/4
                  </td>
                  {events.map(ev => {
                    const key = `${athlete.id}:${ev.id}`
                    const entry = entryMap.get(key)
                    const isAssigned = !!entry
                    const isRelay = ev.is_relay
                    const disabled = !isCoach || (!isRelay && atLimit && !isAssigned)
                    return (
                      <td
                        key={ev.id}
                        className={`text-center py-1.5 ${isAssigned ? categoryBgActive[ev.category] || 'bg-gray-500' : ''}`}
                      >
                        <button
                          disabled={disabled}
                          onClick={() => onToggle(athlete.id, ev.id, isAssigned, entry?.id)}
                          className={`w-7 h-7 rounded transition-all ${
                            disabled && !isAssigned
                              ? 'cursor-not-allowed opacity-30'
                              : isAssigned
                              ? 'text-white font-bold hover:opacity-80'
                              : 'hover:bg-gray-200 text-gray-300 hover:text-gray-500'
                          }`}
                          title={isAssigned ? `Remove from ${ev.name}` : disabled ? 'At limit' : `Add to ${ev.name}`}
                        >
                          {isAssigned ? '✓' : '·'}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {activeAthletes.length === 0 && (
        <p className="text-center text-gray-400 py-8">No active athletes</p>
      )}
    </div>
  )
}

/* ───── Main MeetDetail Page ───── */
export default function MeetDetail() {
  const { id } = useParams<{ id: string }>()
  const { isCoach } = useAuth()
  const { meet, loading: meetLoading } = useMeet(id)
  const { meets } = useMeets()
  const { events, loading: eventsLoading } = useEvents()
  const { athletes } = useAthletes()
  const {
    entries, loading: entriesLoading,
    addEntry, removeEntry, refetch: refetchEntries,
    getEntriesByEvent, getAthleteEventCount
  } = useMeetEntries(id)

  const [assigningEvent, setAssigningEvent] = useState<TrackEvent | null>(null)
  const [relaysCountTowardLimit, setRelaysCountTowardLimit] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('card')
  const [showCopyModal, setShowCopyModal] = useState(false)

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

  /* ── Grid toggle handler ── */
  const handleGridToggle = async (athleteId: string, eventId: string, isAssigned: boolean, entryId?: string) => {
    if (!id) return
    if (isAssigned && entryId) {
      await removeEntry(entryId)
    } else {
      const event = events.find(e => e.id === eventId)
      await addEntry({
        meet_id: id,
        athlete_id: athleteId,
        event_id: eventId,
        relay_leg: null,
        relay_team: event?.is_relay ? 'A' : null,
      })
    }
  }

  /* ── Copy from previous meet ── */
  const handleCopyFromMeet = async (sourceMeetId: string) => {
    if (!id) return
    // Fetch entries from source meet
    const { data: sourceEntries, error } = await supabase
      .from('meet_entries')
      .select('athlete_id, event_id, relay_leg, relay_team')
      .eq('meet_id', sourceMeetId)

    if (error || !sourceEntries) return

    // Build set of existing entries to skip duplicates
    const existingKeys = new Set(
      entries.map(e => `${e.athlete_id}:${e.event_id}`)
    )

    let added = 0
    for (const src of sourceEntries) {
      const key = `${src.athlete_id}:${src.event_id}`
      if (existingKeys.has(key)) continue
      await addEntry({
        meet_id: id,
        athlete_id: src.athlete_id,
        event_id: src.event_id,
        relay_leg: src.relay_leg ?? null,
        relay_team: (src.relay_team as 'A' | 'Alt') ?? null,
      })
      existingKeys.add(key)
      added++
    }

    if (added === 0) {
      alert('All entries from that meet already exist here.')
    }
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
              {isCoach && (
                <button
                  onClick={() => setShowCopyModal(true)}
                  className="btn-ghost text-white hover:bg-navy-700 text-sm"
                >
                  <svg className="w-4 h-4 mr-1.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy from Meet
                </button>
              )}
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

      {/* Coach settings bar */}
      {isCoach && (
        <div className="no-print flex flex-wrap items-center justify-between gap-3 bg-gold-50 rounded-lg p-3 border border-gold-200">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={relaysCountTowardLimit}
              onChange={e => setRelaysCountTowardLimit(e.target.checked)}
              className="rounded border-gray-300 text-navy-800 focus:ring-navy-500"
            />
            <span className="text-navy-800">Count relays toward 4-event limit</span>
          </label>

          {/* View mode toggle */}
          <div className="flex rounded-lg overflow-hidden border border-gold-300">
            <button
              onClick={() => setViewMode('card')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'card'
                  ? 'bg-navy-800 text-white'
                  : 'bg-white text-navy-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Cards
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-navy-800 text-white'
                  : 'bg-white text-navy-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 10h18M3 14h18M3 6h18M3 18h18" />
              </svg>
              Grid
            </button>
          </div>
        </div>
      )}

      {/* Non-coach view toggle (read-only grid still useful) */}
      {!isCoach && (
        <div className="no-print flex justify-end">
          <div className="flex rounded-lg overflow-hidden border border-gray-300">
            <button
              onClick={() => setViewMode('card')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'card'
                  ? 'bg-navy-800 text-white'
                  : 'bg-white text-navy-700 hover:bg-gray-50'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-navy-800 text-white'
                  : 'bg-white text-navy-700 hover:bg-gray-50'
              }`}
            >
              Grid
            </button>
          </div>
        </div>
      )}

      {/* Category filters (card view only) */}
      {viewMode === 'card' && (
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
      )}

      {/* ── Card View ── */}
      {viewMode === 'card' && (
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
      )}

      {/* ── Grid View ── */}
      {viewMode === 'grid' && (
        <div className="no-print">
          <GridView
            athletes={athletes}
            events={events}
            entries={entries}
            meetId={id || ''}
            isCoach={isCoach}
            relaysCountTowardLimit={relaysCountTowardLimit}
            onToggle={handleGridToggle}
          />
        </div>
      )}

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

      {/* Copy from meet modal */}
      {showCopyModal && (
        <CopyFromMeetModal
          currentMeetId={id || ''}
          meets={meets}
          entries={entries}
          onCopy={handleCopyFromMeet}
          onClose={() => setShowCopyModal(false)}
        />
      )}
    </div>
  )
}
