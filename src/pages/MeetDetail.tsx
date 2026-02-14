import { useState, useMemo, useCallback, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useMeet, useMeets } from '../hooks/useMeets'
import { useEvents } from '../hooks/useEvents'
import { useAthletes } from '../hooks/useAthletes'
import { useMeetEntries } from '../hooks/useMeetEntries'
import { useTeam, useTeamPath } from '../hooks/useTeam'
import EventCard from '../components/EventCard'
import AthleteAssignModal from '../components/AthleteAssignModal'
import PrintMeetSheet from '../components/PrintMeetSheet'
import TFRRSLink from '../components/TFRRSLink'
import { searchTFRRSMeet, isValidResultsUrl } from '../lib/tfrrs'
import type { TrackEvent, Meet, MeetEntryWithDetails, TFRRSMeetLink } from '../types/database'
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
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center">
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
                    className={`w-full text-left p-3 rounded-lg transition-colors min-h-[44px] ${
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
            <button onClick={onClose} className="btn-ghost text-sm min-h-[44px]">Cancel</button>
            <button
              onClick={handleCopy}
              disabled={copying}
              className="btn-primary text-sm flex items-center space-x-2 min-h-[44px]"
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

/* ───── Grid View (Mobile-responsive) ───── */
interface GridViewProps {
  athletes: { id: string; first_name: string; last_name: string; active: boolean }[]
  events: TrackEvent[]
  entries: MeetEntryWithDetails[]
  isCoach: boolean
  relaysCountTowardLimit: boolean
  onToggle: (athleteId: string, eventId: string, isAssigned: boolean, entryId?: string) => void
}

function GridView({ athletes, events, entries, isCoach, relaysCountTowardLimit, onToggle }: GridViewProps) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(events[0]?.id || null)

  // Build athlete event counts for 4-event limit
  const athleteCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const entry of entries) {
      if (!relaysCountTowardLimit && entry.events?.is_relay) continue
      counts[entry.athlete_id] = (counts[entry.athlete_id] || 0) + 1
    }
    return counts
  }, [entries, relaysCountTowardLimit])

  const selectedEvent = events.find(e => e.id === selectedEventId)
  const eventEntries = entries.filter(e => e.event_id === selectedEventId)
  const assignedAthleteIds = new Set(eventEntries.map(e => e.athlete_id))
  
  const availableAthletes = athletes
    .filter(a => a.active && !assignedAthleteIds.has(a.id))
    .sort((a, b) => a.last_name.localeCompare(b.last_name) || a.first_name.localeCompare(b.first_name))

  const assignedAthletes = eventEntries
    .map(entry => ({
      ...entry.athletes,
      entryId: entry.id,
      relay_leg: entry.relay_leg,
      relay_team: entry.relay_team
    }))
    .sort((a, b) => (a.relay_leg || 99) - (b.relay_leg || 99))

  const handleAssignAthlete = async (athleteId: string) => {
    if (!selectedEventId || !isCoach) return
    
    const count = athleteCounts[athleteId] || 0
    if (count >= 4 && !selectedEvent?.is_relay) {
      alert('This athlete already has 4 events!')
      return
    }
    
    onToggle(athleteId, selectedEventId, false)
  }

  const handleRemoveEntry = async (entryId: string) => {
    if (!isCoach) return
    const entry = eventEntries.find(e => e.id === entryId)
    if (entry) {
      onToggle(entry.athlete_id, entry.event_id, true, entryId)
    }
  }

  return (
    <div className="space-y-4">
      {/* Event selector - horizontal scroll on mobile */}
      <div className="overflow-x-auto -mx-4 px-4 pb-2">
        <div className="flex gap-2 min-w-max">
          {events.map(event => {
            const eventCount = entries.filter(e => e.event_id === event.id).length
            const isSelected = event.id === selectedEventId
            return (
              <button
                key={event.id}
                onClick={() => setSelectedEventId(event.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap min-h-[44px] ${
                  isSelected
                    ? `${categoryBgActive[event.category] || 'bg-gray-600'} text-white shadow-md`
                    : `${categoryBg[event.category] || 'bg-gray-100'} text-gray-700 hover:shadow-sm`
                }`}
              >
                <div>{event.short_name}</div>
                <div className="text-xs opacity-75">{eventCount} entered</div>
              </button>
            )
          })}
        </div>
      </div>

      {selectedEvent && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assigned Athletes */}
          <div className="space-y-2">
            <h3 className="font-semibold text-navy-900">
              {selectedEvent.name} ({assignedAthletes.length})
            </h3>
            {assignedAthletes.length === 0 ? (
              <p className="text-gray-400 text-sm italic">No athletes assigned</p>
            ) : (
              <div className="space-y-1">
                {assignedAthletes.map((athlete, idx) => (
                  <div key={athlete.entryId} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg min-h-[44px]">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-gray-400 w-6">
                        {selectedEvent.is_relay && athlete.relay_leg ? `L${athlete.relay_leg}` : `${idx + 1}.`}
                      </span>
                      <span className="font-medium text-navy-800">
                        {athlete.last_name}, {athlete.first_name}
                      </span>
                      {selectedEvent.is_relay && athlete.relay_team && (
                        <span className="text-xs bg-navy-100 text-navy-600 px-1.5 py-0.5 rounded">
                          {athlete.relay_team}
                        </span>
                      )}
                    </div>
                    {isCoach && (
                      <button
                        onClick={() => handleRemoveEntry(athlete.entryId)}
                        className="text-cardinal-500 hover:text-cardinal-700 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
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

          {/* Available Athletes */}
          {isCoach && (
            <div className="space-y-2">
              <h3 className="font-semibold text-navy-900">
                Add Athletes ({availableAthletes.length} available)
              </h3>
              {availableAthletes.length === 0 ? (
                <p className="text-gray-400 text-sm italic">All athletes assigned or at limit</p>
              ) : (
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {availableAthletes.map(athlete => {
                    const count = athleteCounts[athlete.id] || 0
                    const atLimit = count >= 4 && !selectedEvent.is_relay
                    return (
                      <button
                        key={athlete.id}
                        onClick={() => handleAssignAthlete(athlete.id)}
                        disabled={atLimit}
                        className={`w-full flex items-center justify-between py-2 px-3 rounded-lg transition-colors text-left min-h-[44px] ${
                          atLimit
                            ? 'bg-red-50 text-red-400 cursor-not-allowed opacity-60'
                            : 'bg-white border hover:bg-navy-50 text-navy-800'
                        }`}
                      >
                        <span className="font-medium">
                          {athlete.last_name}, {athlete.first_name}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          count >= 4 ? 'bg-red-100 text-red-700' :
                          count >= 3 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {count}/4
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
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
  const teamPath = useTeamPath()
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
  const [genderFilter, setGenderFilter] = useState<'all' | 'Boys' | 'Girls'>('all')
  const { team, guestMode } = useTeam()
  const effectiveIsCoach = isCoach && !guestMode

  // Per-meet event activation state
  const [deactivatedList, setDeactivatedList] = useState<string[]>([])

  // Fetch deactivated events for this meet
  useEffect(() => {
    if (!id) return
    async function fetchDeactivated() {
      const { data, error } = await supabase
        .from('meet_event_status')
        .select('event_id')
        .eq('meet_id', id!)
        .eq('active', false)
      if (error) {
        console.error('Failed to fetch meet_event_status:', error)
        return
      }
      if (data) {
        setDeactivatedList(data.map((d: { event_id: string }) => d.event_id).sort())
      }
    }
    fetchDeactivated()
  }, [id])

  const toggleEventActive = async (eventId: string) => {
    if (!id) return
    const isCurrentlyDeactivated = deactivatedList.includes(eventId)

    if (isCurrentlyDeactivated) {
      // Re-activate: delete the row
      const { error } = await supabase
        .from('meet_event_status')
        .delete()
        .eq('meet_id', id)
        .eq('event_id', eventId)
      if (error) { console.error('Failed to reactivate event:', error); return }
      setDeactivatedList(prev => prev.filter(eid => eid !== eventId))
    } else {
      // Deactivate: insert row with active=false
      const { error } = await supabase
        .from('meet_event_status')
        .upsert({
          meet_id: id,
          event_id: eventId,
          active: false,
        } as Record<string, unknown>, { onConflict: 'meet_id,event_id' })
      if (error) { console.error('Failed to deactivate event:', error); return }
      setDeactivatedList(prev => [...prev, eventId].sort())
    }
  }

  const isEventActive = (eventId: string) => !deactivatedList.includes(eventId)

  // TFRRS state
  const [tfrrsLinks, setTfrrsLinks] = useState<TFRRSMeetLink[]>([])
  const [showTFRRSInput, setShowTFRRSInput] = useState(false)
  const [tfrrsInput, setTfrrsInput] = useState('')
  const [tfrrsLoading, setTfrrsLoading] = useState(false)

  // Fetch TFRRS links for this meet
  useEffect(() => {
    if (!id) return
    async function fetchTFRRS() {
      const { data } = await supabase
        .from('tfrrs_meet_links')
        .select('*')
        .eq('meet_id', id!)
      if (data) setTfrrsLinks(data as TFRRSMeetLink[])
    }
    fetchTFRRS()
  }, [id])

  const handleAddTFRRS = async () => {
    if (!id || !tfrrsInput) return
    if (!isValidResultsUrl(tfrrsInput)) {
      alert('Please enter a valid URL (e.g. https://florida.tfrrs.org/...)')
      return
    }
    setTfrrsLoading(true)
    const { data, error } = await supabase
      .from('tfrrs_meet_links')
      .insert({ meet_id: id, tfrrs_url: tfrrsInput } as Record<string, unknown>)
      .select()
      .single()
    if (!error && data) {
      setTfrrsLinks(prev => [...prev, data as TFRRSMeetLink])
      setTfrrsInput('')
      setShowTFRRSInput(false)
    }
    setTfrrsLoading(false)
  }

  const handleRemoveTFRRS = async (linkId: string) => {
    await supabase.from('tfrrs_meet_links').delete().eq('id', linkId)
    setTfrrsLinks(prev => prev.filter(l => l.id !== linkId))
  }

  const loading = meetLoading || eventsLoading || entriesLoading

  // Auto-detect gender from meet name (e.g. "Boys JV Meet #1", "Girls Varsity Meet")
  const meetNameLower = meet?.name?.toLowerCase() ?? ''
  const meetGenderHint: 'Boys' | 'Girls' | null =
    meetNameLower.includes('boys') ? 'Boys' :
    meetNameLower.includes('girls') ? 'Girls' :
    null

  // Filter athletes by meet level + gender
  const filteredAthletes = useMemo(() => {
    if (!meet) return []
    return athletes.filter(a => {
      if (!a.active) return false
      // Filter by meet level
      if (meet.level !== 'Both' && a.level !== meet.level) return false
      // Filter by gender tab (or auto-detected from meet name)
      const activeGender = genderFilter !== 'all' ? genderFilter : meetGenderHint
      if (activeGender && a.gender !== activeGender) return false
      return true
    })
  }, [athletes, meet, genderFilter, meetGenderHint])

  // Filter events: hide inactive ones for non-coaches, apply category filter
  // NOTE: must be ABOVE early returns to keep hook count stable
  const visibleEvents = useMemo(() => {
    let evts = events
    if (!effectiveIsCoach) {
      evts = evts.filter(e => !deactivatedList.includes(e.id))
    }
    if (activeCategory) {
      evts = evts.filter(e => e.category === activeCategory)
    }
    return evts
  }, [events, effectiveIsCoach, deactivatedList, activeCategory])

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

  const categories = ['Field', 'Sprint', 'Distance', 'Hurdles', 'Relay', 'Other']

  // Keep filteredEvents name for backward compat in renders
  const filteredEvents = visibleEvents

  const handleAssign = async (athleteId: string, relayLeg?: number, relayTeam?: string) => {
    if (!assigningEvent || !id) return

    if (!isEventActive(assigningEvent.id)) {
      alert('This event is deactivated for this meet.')
      return
    }

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
        <Link to={teamPath('/meets')} className="text-sm text-navy-600 hover:text-navy-800 font-medium mb-2 inline-block min-h-[44px] flex items-center">
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
              {effectiveIsCoach && (
                <button
                  onClick={() => setShowCopyModal(true)}
                  className="btn-ghost text-white hover:bg-navy-700 text-sm min-h-[44px]"
                >
                  <svg className="w-4 h-4 mr-1.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy from Meet
                </button>
              )}
              <Link to={teamPath(`/meets/${id}/report`)} className="btn-ghost text-white hover:bg-navy-700 text-sm min-h-[44px] inline-flex items-center">
                <svg className="w-4 h-4 mr-1.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Meet Roster
              </Link>
              <button onClick={handlePrint} className="btn-ghost text-white hover:bg-navy-700 text-sm min-h-[44px]">
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
                {events.filter(e => (effectiveIsCoach || isEventActive(e.id)) && getEntriesByEvent(e.id).length > 0).length}
              </p>
              <p className="text-xs text-gray-300">Active Events</p>
            </div>
          </div>

          {meet.notes && (
            <p className="mt-3 text-sm text-gray-300 border-t border-navy-700 pt-3">{meet.notes}</p>
          )}

          {/* Results Links */}
          {(tfrrsLinks.length > 0 || effectiveIsCoach) && (
            <div className="mt-3 border-t border-navy-700 pt-3">
              <div className="flex items-center flex-wrap gap-2">
                {tfrrsLinks.map(link => (
                  <div key={link.id} className="flex items-center gap-1">
                    <TFRRSLink url={link.tfrrs_url} variant="button" />
                    {effectiveIsCoach && (
                      <button
                        onClick={() => handleRemoveTFRRS(link.id)}
                        className="text-red-300 hover:text-red-100 p-1"
                        title="Remove results link"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}

                {effectiveIsCoach && !showTFRRSInput && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowTFRRSInput(true)}
                      className="text-sm text-blue-300 hover:text-blue-100 font-medium"
                    >
                      + Add Results Link
                    </button>
                    <a
                      href={searchTFRRSMeet(meet.name, meet.date)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-400 hover:text-gray-200"
                    >
                      Search FL TFRRS
                    </a>
                  </div>
                )}
              </div>

              {effectiveIsCoach && showTFRRSInput && (
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <input
                    type="url"
                    value={tfrrsInput}
                    onChange={e => setTfrrsInput(e.target.value)}
                    placeholder="Paste any results URL (TFRRS, MileSplit, etc.)..."
                    className="flex-1 bg-navy-700 border border-navy-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-400 focus:ring-1 focus:ring-gold-400 focus:border-gold-400"
                  />
                  <button
                    onClick={handleAddTFRRS}
                    disabled={tfrrsLoading}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    {tfrrsLoading ? '...' : 'Add'}
                  </button>
                  <button
                    onClick={() => { setShowTFRRSInput(false); setTfrrsInput('') }}
                    className="text-gray-400 hover:text-white text-sm"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Coach settings bar */}
      {effectiveIsCoach && (
        <div className="no-print flex flex-wrap items-center justify-between gap-3 bg-gold-50 rounded-lg p-3 border border-gold-200">
          <label className="flex items-center space-x-2 text-sm min-h-[44px]">
            <input
              type="checkbox"
              checked={relaysCountTowardLimit}
              onChange={e => setRelaysCountTowardLimit(e.target.checked)}
              className="rounded border-gray-300 text-navy-800 focus:ring-navy-500 w-5 h-5"
            />
            <span className="text-navy-800">Count relays toward 4-event limit</span>
          </label>

          {/* View mode toggle */}
          <div className="flex rounded-lg overflow-hidden border border-gold-300">
            <button
              onClick={() => setViewMode('card')}
              className={`px-3 py-2 text-sm font-medium transition-colors min-h-[44px] ${
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
              className={`px-3 py-2 text-sm font-medium transition-colors min-h-[44px] ${
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
      {!effectiveIsCoach && (
        <div className="no-print flex justify-end">
          <div className="flex rounded-lg overflow-hidden border border-gray-300">
            <button
              onClick={() => setViewMode('card')}
              className={`px-3 py-2 text-sm font-medium transition-colors min-h-[44px] ${
                viewMode === 'card'
                  ? 'bg-navy-800 text-white'
                  : 'bg-white text-navy-700 hover:bg-gray-50'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm font-medium transition-colors min-h-[44px] ${
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

      {/* Gender filter (only show if meet doesn't already specify gender) */}
      {!meetGenderHint && (
        <div className="no-print flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-600">Show:</span>
          {(['all', 'Boys', 'Girls'] as const).map(g => (
            <button
              key={g}
              onClick={() => setGenderFilter(g)}
              className={`px-3 py-2 rounded-full text-sm font-medium transition-colors min-h-[44px] ${
                genderFilter === g
                  ? g === 'Boys' ? 'bg-blue-600 text-white'
                    : g === 'Girls' ? 'bg-pink-600 text-white'
                    : 'bg-navy-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {g === 'all' ? 'All Athletes' : g}
            </button>
          ))}
          <span className="text-xs text-gray-400 ml-2">
            {filteredAthletes.length} available
          </span>
        </div>
      )}
      {meetGenderHint && (
        <div className="no-print text-sm text-gray-500">
          Showing <strong>{meetGenderHint}</strong> {meet.level !== 'Both' ? meet.level : ''} athletes ({filteredAthletes.length} available)
        </div>
      )}

      {/* Category filters (card view only) */}
      {viewMode === 'card' && (
        <div className="no-print flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-3 py-2 rounded-full text-sm font-medium transition-colors min-h-[44px] ${
              !activeCategory ? 'bg-navy-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Events
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={`px-3 py-2 rounded-full text-sm font-medium transition-colors min-h-[44px] ${
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
              isCoach={effectiveIsCoach}
              isActive={isEventActive(event.id)}
              onToggleActive={effectiveIsCoach ? toggleEventActive : undefined}
              onAssign={isEventActive(event.id) ? () => setAssigningEvent(event) : undefined}
              onRemoveEntry={handleRemoveEntry}
            />
          ))}
        </div>
      )}

      {/* ── Grid View ── */}
      {viewMode === 'grid' && (
        <div className="no-print">
          <GridView
            athletes={filteredAthletes}
            events={effectiveIsCoach ? events : events.filter(e => isEventActive(e.id))}
            entries={entries}
            isCoach={effectiveIsCoach}
            relaysCountTowardLimit={relaysCountTowardLimit}
            onToggle={handleGridToggle}
          />
        </div>
      )}

      {/* Assign modal */}
      {assigningEvent && (
        <AthleteAssignModal
          event={assigningEvent}
          athletes={filteredAthletes}
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
