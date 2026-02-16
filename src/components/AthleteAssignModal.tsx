import { useState, useMemo, useCallback } from 'react'
import type { Athlete, TrackEvent, MeetEntryWithDetails } from '../types/database'
import SearchBar from './SearchBar'

interface Props {
  event: TrackEvent
  athletes: Athlete[]
  entries: MeetEntryWithDetails[]
  allEntries: MeetEntryWithDetails[]
  relaysCountTowardLimit: boolean
  onAssign: (athleteId: string, relayLeg?: number, relayTeam?: string) => Promise<void>
  onClose: () => void
}

export default function AthleteAssignModal({
  event, athletes, entries, allEntries,
  relaysCountTowardLimit, onAssign, onClose
}: Props) {
  const [search, setSearch] = useState('')
  const [assigning, setAssigning] = useState<string | null>(null)
  const [batchAssigning, setBatchAssigning] = useState(false)
  const [relayLeg, setRelayLeg] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const assignedAthleteIds = new Set(entries.map(e => e.athlete_id))

  const athleteEventCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const entry of allEntries) {
      if (!relaysCountTowardLimit && entry.events?.is_relay) continue
      counts[entry.athlete_id] = (counts[entry.athlete_id] || 0) + 1
    }
    return counts
  }, [allEntries, relaysCountTowardLimit])

  const filteredAthletes = useMemo(() => {
    const q = search.toLowerCase()
    return athletes
      .filter(a => a.active)
      .filter(a => !assignedAthleteIds.has(a.id))
      .filter(a =>
        !q ||
        a.first_name.toLowerCase().includes(q) ||
        a.last_name.toLowerCase().includes(q) ||
        `${a.last_name} ${a.first_name}`.toLowerCase().includes(q) ||
        `${a.first_name} ${a.last_name}`.toLowerCase().includes(q)
      )
      .sort((a, b) => a.last_name.localeCompare(b.last_name) || a.first_name.localeCompare(b.first_name))
  }, [athletes, search, assignedAthleteIds])

  const handleAssign = async (athleteId: string) => {
    setAssigning(athleteId)
    try {
      if (event.is_relay) {
        const team = event.short_name.includes('Alt') ? 'Alt' : 'A'
        await onAssign(athleteId, relayLeg, team)
        setRelayLeg(prev => Math.min(prev + 1, 4))
      } else {
        await onAssign(athleteId)
      }
    } finally {
      setAssigning(null)
    }
  }

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleBatchAssign = async () => {
    if (selectedIds.size === 0) return
    setBatchAssigning(true)
    try {
      const ids = Array.from(selectedIds)
      for (const id of ids) {
        if (event.is_relay) {
          const team = event.short_name.includes('Alt') ? 'Alt' : 'A'
          await onAssign(id, undefined, team)
        } else {
          await onAssign(id)
        }
      }
      setSelectedIds(new Set())
    } finally {
      setBatchAssigning(false)
    }
  }

  const selectableAthletes = filteredAthletes.filter(a => {
    const count = athleteEventCounts[a.id] || 0
    return event.is_relay || count < 4
  })

  const handleSelectAll = () => {
    if (selectedIds.size === selectableAthletes.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(selectableAthletes.map(a => a.id)))
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold text-navy-900 text-lg">Assign to {event.name}</h3>
            <p className="text-sm text-gray-500">
              {entries.length} assigned
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Relay leg selector */}
        {event.is_relay && (
          <div className="px-4 pt-3 flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Leg:</label>
            {[1, 2, 3, 4].map(leg => (
              <button
                key={leg}
                onClick={() => setRelayLeg(leg)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  relayLeg === leg
                    ? 'bg-navy-800 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {leg}
              </button>
            ))}
          </div>
        )}

        {/* Search + select all */}
        <div className="p-4 space-y-2">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search for athlete..."
          />
          {filteredAthletes.length > 0 && (
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIds.size === selectableAthletes.length && selectableAthletes.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-navy-800 focus:ring-navy-500"
                />
                <span>Select all ({selectableAthletes.length})</span>
              </label>
              {selectedIds.size > 0 && (
                <span className="text-xs text-navy-600 font-medium">
                  {selectedIds.size} selected
                </span>
              )}
            </div>
          )}
        </div>

        {/* Athlete list */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {filteredAthletes.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No athletes found</p>
          ) : (
            <div className="space-y-1">
              {filteredAthletes.map(athlete => {
                const count = athleteEventCounts[athlete.id] || 0
                const atLimit = count >= 4
                const isSelected = selectedIds.has(athlete.id)
                const isDisabled = atLimit && !event.is_relay
                return (
                  <div
                    key={athlete.id}
                    className={`flex items-center p-3 rounded-lg transition-colors ${
                      isDisabled
                        ? 'bg-red-50 opacity-60'
                        : isSelected
                        ? 'bg-navy-50 ring-1 ring-navy-300'
                        : 'hover:bg-navy-50'
                    }`}
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={isDisabled}
                      onChange={() => toggleSelected(athlete.id)}
                      className="rounded border-gray-300 text-navy-800 focus:ring-navy-500 mr-3 flex-shrink-0"
                    />

                    {/* Athlete info — tap to single assign */}
                    <button
                      onClick={() => handleAssign(athlete.id)}
                      disabled={assigning === athlete.id || isDisabled}
                      className="flex-1 flex items-center justify-between min-w-0"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-8 h-8 bg-navy-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-navy-700">
                            {athlete.first_name[0]}{athlete.last_name[0]}
                          </span>
                        </div>
                        <span className="font-medium text-sm text-navy-800 truncate">
                          {athlete.last_name}, {athlete.first_name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          atLimit
                            ? 'bg-red-100 text-red-700'
                            : count >= 3
                            ? 'bg-brand-100 text-brand-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {count}/4
                        </span>
                        {assigning === athlete.id ? (
                          <div className="w-5 h-5 animate-spin rounded-full border-2 border-navy-300 border-t-navy-800" />
                        ) : (
                          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        )}
                      </div>
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Batch assign footer */}
        {selectedIds.size > 0 && (
          <div className="border-t bg-navy-50 p-3 rounded-b-2xl flex items-center justify-between">
            <span className="text-sm text-navy-700 font-medium">
              {selectedIds.size} athlete{selectedIds.size > 1 ? 's' : ''} selected
            </span>
            <button
              onClick={handleBatchAssign}
              disabled={batchAssigning}
              className="btn-primary text-sm flex items-center space-x-2"
            >
              {batchAssigning ? (
                <>
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>Adding...</span>
                </>
              ) : (
                <span>Add Selected ({selectedIds.size})</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
