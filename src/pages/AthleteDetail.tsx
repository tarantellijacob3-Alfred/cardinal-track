import { useParams, Link } from 'react-router-dom'
import { useAthlete, useAthletes } from '../hooks/useAthletes'
import { useAthleteEntries } from '../hooks/useMeetEntries'
import { useTeam, useTeamPath } from '../hooks/useTeam'
import { useAuth } from '../contexts/AuthContext'
import { useFavorites } from '../hooks/useFavorites'
import { supabase } from '../lib/supabase'
import { searchTFRRS, isValidTFRRSUrl } from '../lib/tfrrs'
import TFRRSLink from '../components/TFRRSLink'
import SeasonSelector from '../components/SeasonSelector'
import AthleteSeasonStats from '../components/AthleteSeasonStats'
import { useState, useEffect, useMemo } from 'react'
import type { Meet } from '../types/database'

export default function AthleteDetail() {
  const { id } = useParams<{ id: string }>()
  const { athlete, loading: athleteLoading } = useAthlete(id)
  const { updateAthlete } = useAthletes()
  const { entries, loading: entriesLoading } = useAthleteEntries(id)
  const { team, guestMode, selectedSeasonId } = useTeam()
  const teamPath = useTeamPath()
  const { user, isCoach } = useAuth()
  const { isFavorite, toggleFavorite } = useFavorites()
  const [meets, setMeets] = useState<Meet[]>([])
  const [showTFRRSInput, setShowTFRRSInput] = useState(false)
  const [tfrrsInput, setTfrrsInput] = useState('')
  const [tfrrsLoading, setTfrrsLoading] = useState(false)

  const effectiveIsCoach = isCoach && !guestMode
  const showFavorites = user && !guestMode

  useEffect(() => {
    async function fetchMeets() {
      const query = supabase.from('meets').select('*').order('date', { ascending: false })
      // Scope to team if available
      if (team?.id) {
        query.eq('team_id', team.id)
      }
      const { data } = await query
      if (data) setMeets(data)
    }
    if (team?.id) fetchMeets()
  }, [team?.id])

  const loading = athleteLoading || entriesLoading

  // Filter entries by selected season
  const filteredEntries = useMemo(() => {
    if (!selectedSeasonId) return entries
    const seasonMeetIds = new Set(
      meets.filter(m => m.season_id === selectedSeasonId).map(m => m.id)
    )
    return entries.filter(e => seasonMeetIds.has(e.meet_id))
  }, [entries, selectedSeasonId, meets])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-800" />
      </div>
    )
  }

  if (!athlete) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-navy-900">Athlete not found</h2>
        <Link to={teamPath('/roster')} className="btn-primary inline-block mt-4">Back to Roster</Link>
      </div>
    )
  }

  // Group entries by meet
  const entriesByMeet: Record<string, typeof filteredEntries> = {}
  for (const entry of filteredEntries) {
    if (!entriesByMeet[entry.meet_id]) {
      entriesByMeet[entry.meet_id] = []
    }
    entriesByMeet[entry.meet_id].push(entry)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to={teamPath('/roster')} className="text-sm text-navy-600 hover:text-navy-800 font-medium mb-2 inline-flex items-center min-h-[44px]">
          ← Back to Roster
        </Link>
        <SeasonSelector />
      </div>

      {/* Athlete header */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-navy-100 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-navy-700">
                {athlete.first_name[0]}{athlete.last_name[0]}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-navy-900">
                {athlete.first_name} {athlete.last_name}
              </h1>
              <div className="flex items-center flex-wrap gap-2 mt-1">
                <span className={`badge ${athlete.level === 'JV' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                  {athlete.level}
                </span>
                <span className="badge bg-gray-100 text-gray-800">{athlete.gender}</span>
                {athlete.grade && (
                  <span className="text-sm text-gray-500">Grade {athlete.grade}</span>
                )}
                {athlete.tfrrs_url && (
                  <TFRRSLink url={athlete.tfrrs_url} />
                )}
              </div>
              {/* Season stats */}
              {selectedSeasonId && id && (
                <div className="mt-2">
                  <AthleteSeasonStats athleteId={id} />
                </div>
              )}
            </div>
          </div>

          {/* Favorite button — hidden in guest mode */}
          {showFavorites && (
            <button
              onClick={() => toggleFavorite(athlete.id)}
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
              title={isFavorite(athlete.id) ? 'Remove from favorites' : 'Add to favorites'}
            >
              {isFavorite(athlete.id) ? (
                <svg className="w-7 h-7 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ) : (
                <svg className="w-7 h-7 text-gray-300 hover:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* TFRRS linking (coach only) */}
        {effectiveIsCoach && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            {athlete.tfrrs_url ? (
              <div className="flex items-center justify-between">
                <TFRRSLink url={athlete.tfrrs_url} variant="button" />
                <button
                  onClick={() => {
                    setTfrrsInput(athlete.tfrrs_url || '')
                    setShowTFRRSInput(true)
                  }}
                  className="text-sm text-gray-500 hover:text-navy-700"
                >
                  Edit TFRRS Link
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={searchTFRRS(team?.school_name || '', `${athlete.first_name} ${athlete.last_name}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Search TFRRS</span>
                </a>
                <button
                  onClick={() => setShowTFRRSInput(true)}
                  className="text-sm text-navy-600 hover:text-navy-800 font-medium"
                >
                  Link to TFRRS
                </button>
              </div>
            )}

            {showTFRRSInput && (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <input
                  type="url"
                  value={tfrrsInput}
                  onChange={e => setTfrrsInput(e.target.value)}
                  placeholder="Paste TFRRS profile URL..."
                  className="input flex-1 text-sm"
                />
                <button
                  onClick={async () => {
                    if (tfrrsInput && !isValidTFRRSUrl(tfrrsInput)) {
                      alert('Please enter a valid TFRRS URL (tfrrs.org)')
                      return
                    }
                    setTfrrsLoading(true)
                    await updateAthlete(athlete.id, { tfrrs_url: tfrrsInput || null } as Record<string, unknown>)
                    setTfrrsLoading(false)
                    setShowTFRRSInput(false)
                    // Reload page to reflect changes
                    window.location.reload()
                  }}
                  disabled={tfrrsLoading}
                  className="btn-primary text-sm min-h-[36px]"
                >
                  {tfrrsLoading ? '...' : 'Save'}
                </button>
                <button
                  onClick={() => setShowTFRRSInput(false)}
                  className="btn-ghost text-sm min-h-[36px]"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats — only count meets that have already happened */}
      {(() => {
        const today = new Date()
        today.setHours(23, 59, 59, 999) // include today's meets
        const pastMeetIds = Object.keys(entriesByMeet).filter(meetId => {
          const meet = meets.find(m => m.id === meetId)
          if (!meet) return false
          return new Date(meet.date + 'T00:00:00') <= today
        })
        const pastEntryCount = pastMeetIds.reduce((sum, meetId) => sum + (entriesByMeet[meetId]?.length || 0), 0)
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="card text-center">
              <p className="text-3xl font-bold text-navy-800">{pastMeetIds.length}</p>
              <p className="text-sm text-gray-500">Meets</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold text-navy-800">{pastEntryCount}</p>
              <p className="text-sm text-gray-500">Total Entries</p>
            </div>
          </div>
        )
      })()}

      {/* Meet assignments */}
      <div>
        <h2 className="text-lg font-semibold text-navy-900 mb-3">Meet Assignments</h2>
        {Object.keys(entriesByMeet).length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-gray-400">No meet assignments yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(entriesByMeet).map(([meetId, meetEntries]) => {
              const meet = meets.find(m => m.id === meetId)
              if (!meet) return null
              const meetDate = new Date(meet.date + 'T00:00:00')

              return (
                <Link key={meetId} to={teamPath(`/meets/${meetId}`)} className="card block hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-navy-900">{meet.name}</h3>
                      <p className="text-sm text-gray-500">
                        {meetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {meet.location && ` — ${meet.location}`}
                      </p>
                    </div>
                    <span className="badge bg-navy-100 text-navy-700">{meetEntries.length} events</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {meetEntries.map(entry => (
                      <span key={entry.id} className={`text-sm px-3 py-1.5 rounded-full font-medium ${
                        entry.events.category === 'Field' ? 'bg-green-100 text-green-800' :
                        entry.events.category === 'Sprint' ? 'bg-blue-100 text-blue-800' :
                        entry.events.category === 'Distance' ? 'bg-purple-100 text-purple-800' :
                        entry.events.category === 'Hurdles' ? 'bg-orange-100 text-orange-800' :
                        entry.events.category === 'Relay' ? 'bg-pink-100 text-pink-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {entry.events.short_name}
                        {entry.relay_leg ? ` (L${entry.relay_leg})` : ''}
                      </span>
                    ))}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
