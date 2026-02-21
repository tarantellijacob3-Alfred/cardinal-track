import { useState, useMemo, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTeam, useTeamPath } from '../hooks/useTeam'
import { useAuth } from '../contexts/AuthContext'
import { useFavorites } from '../hooks/useFavorites'
import SearchBar from '../components/SearchBar'
import type { Athlete, Meet, MeetEntryWithDetails } from '../types/database'

export default function PublicSearch() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [meets, setMeets] = useState<Meet[]>([])
  const [allEntries, setAllEntries] = useState<MeetEntryWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const { team } = useTeam()
  const teamPath = useTeamPath()
  const { user } = useAuth()
  const { guestMode } = useTeam()
  const { isFavorite, toggleFavorite } = useFavorites()
  const showFavorites = user && !guestMode

  // Filters
  const [genderFilter, setGenderFilter] = useState<string>('all')
  const [gradeFilter, setGradeFilter] = useState<string>('all')
  const [levelFilter, setLevelFilter] = useState<string>('all')

  // Derive selected athlete from URL param so browser back works
  const selectedAthleteId = searchParams.get('athlete')
  const selectedAthlete = useMemo(
    () => athletes.find(a => a.id === selectedAthleteId) || null,
    [athletes, selectedAthleteId]
  )

  const selectAthlete = useCallback((athlete: Athlete) => {
    setSearchParams({ q: search, athlete: athlete.id }, { replace: false })
  }, [search, setSearchParams])

  const clearAthlete = useCallback(() => {
    if (search) {
      setSearchParams({ q: search }, { replace: false })
    } else {
      setSearchParams({}, { replace: false })
    }
  }, [search, setSearchParams])

  // Sync local search state when URL changes (e.g. browser back/forward)
  useEffect(() => {
    const q = searchParams.get('q') || ''
    setSearch(q)
  }, [searchParams])

  useEffect(() => {
    async function fetchData() {
      if (!team?.id) return
      setLoading(true)

      const [athletesRes, meetsRes, entriesRes] = await Promise.all([
        supabase.from('athletes').select('*').eq('active', true).eq('team_id', team.id).order('last_name'),
        supabase.from('meets').select('*').eq('team_id', team.id).order('date', { ascending: false }),
        supabase.from('meet_entries').select('*, athletes(*), events(*)'),
      ])

      if (athletesRes.data) setAthletes(athletesRes.data)
      if (meetsRes.data) setMeets(meetsRes.data)
      if (entriesRes.data) setAllEntries(entriesRes.data as unknown as MeetEntryWithDetails[])
      setLoading(false)
    }
    fetchData()
  }, [team?.id])

  // Get unique grades for filter
  const availableGrades = useMemo(() => {
    const grades = new Set(athletes.map(a => a.grade).filter(Boolean))
    return Array.from(grades).sort((a, b) => Number(a) - Number(b))
  }, [athletes])

  // Filter + search athletes
  const filteredAthletes = useMemo(() => {
    let result = athletes

    // Apply filters
    if (genderFilter !== 'all') {
      result = result.filter(a => a.gender === genderFilter)
    }
    if (gradeFilter !== 'all') {
      result = result.filter(a => String(a.grade) === gradeFilter)
    }
    if (levelFilter !== 'all') {
      result = result.filter(a => a.level === levelFilter)
    }

    // Apply search
    if (search && search.length >= 2) {
      const q = search.toLowerCase()
      result = result.filter(a =>
        a.first_name.toLowerCase().includes(q) ||
        a.last_name.toLowerCase().includes(q) ||
        `${a.last_name} ${a.first_name}`.toLowerCase().includes(q) ||
        `${a.first_name} ${a.last_name}`.toLowerCase().includes(q)
      )
    }

    return result
  }, [athletes, search, genderFilter, gradeFilter, levelFilter])

  const athleteEntries = useMemo(() => {
    if (!selectedAthlete) return []
    return allEntries.filter(e => e.athlete_id === selectedAthlete.id)
  }, [selectedAthlete, allEntries])

  // Group by meet
  const entriesByMeet: Record<string, MeetEntryWithDetails[]> = {}
  for (const entry of athleteEntries) {
    if (!entriesByMeet[entry.meet_id]) {
      entriesByMeet[entry.meet_id] = []
    }
    entriesByMeet[entry.meet_id].push(entry)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-800" />
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-navy-900">Find Athletes</h1>
        <p className="text-gray-500 mt-1">{athletes.length} athletes · {team?.name || 'Team'}</p>
      </div>

      {/* Search */}
      <SearchBar
        value={search}
        onChange={(v) => {
          setSearch(v)
          if (v) {
            setSearchParams({ q: v }, { replace: true })
          } else {
            setSearchParams({}, { replace: true })
          }
        }}
        placeholder="Search by name..."
      />

      {/* Filters */}
      {!selectedAthlete && (
        <div className="flex flex-wrap gap-2">
          {/* Gender filter */}
          {['all', 'Boys', 'Girls'].map(g => (
            <button
              key={g}
              onClick={() => setGenderFilter(g === 'all' ? 'all' : g)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                genderFilter === g
                  ? 'bg-navy-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {g === 'all' ? 'All' : g}
            </button>
          ))}

          {/* Divider */}
          <div className="w-px bg-gray-200 mx-1" />

          {/* Level filter */}
          {['all', 'Varsity', 'JV'].map(l => (
            <button
              key={l}
              onClick={() => setLevelFilter(l === 'all' ? 'all' : l)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                levelFilter === l
                  ? 'bg-navy-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {l === 'all' ? 'All Levels' : l}
            </button>
          ))}

          {/* Divider */}
          {availableGrades.length > 0 && <div className="w-px bg-gray-200 mx-1" />}

          {/* Grade filter */}
          {availableGrades.map(g => (
            <button
              key={g}
              onClick={() => setGradeFilter(gradeFilter === String(g) ? 'all' : String(g))}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                gradeFilter === String(g)
                  ? 'bg-navy-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {g}th
            </button>
          ))}

          {/* Clear filters */}
          {(genderFilter !== 'all' || gradeFilter !== 'all' || levelFilter !== 'all') && (
            <button
              onClick={() => { setGenderFilter('all'); setGradeFilter('all'); setLevelFilter('all') }}
              className="px-3 py-1.5 rounded-full text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              ✕ Clear
            </button>
          )}
        </div>
      )}

      {/* Athlete list (shows by default) */}
      {!selectedAthlete && (
        <div className="card">
          {filteredAthletes.length === 0 ? (
            <p className="text-center text-gray-400 py-4">No athletes found</p>
          ) : (
            <>
              <p className="text-xs text-gray-400 mb-2 px-1">
                {filteredAthletes.length} {filteredAthletes.length === 1 ? 'athlete' : 'athletes'}
              </p>
              <div className="divide-y divide-gray-100">
                {filteredAthletes.map(athlete => (
                  <div key={athlete.id} className="flex items-center min-h-[44px]">
                    <button
                      onClick={() => selectAthlete(athlete)}
                      className="flex-1 flex items-center justify-between p-3 hover:bg-navy-50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-navy-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-navy-700">
                            {athlete.first_name[0]}{athlete.last_name[0]}
                          </span>
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-navy-900">
                            {athlete.last_name}, {athlete.first_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {athlete.level} · {athlete.gender}
                            {athlete.grade ? ` · Grade ${athlete.grade}` : ''}
                            {' · '}
                            <span className="whitespace-nowrap">{(() => { const today = new Date().toISOString().split('T')[0]; const completedMeetIds = new Set(meets.filter(m => m.date <= today).map(m => m.id)); const c = new Set(allEntries.filter(e => e.athlete_id === athlete.id && completedMeetIds.has(e.meet_id)).map(e => e.meet_id)).size; return `${c} ${c === 1 ? 'meet' : 'meets'}`; })()}</span>
                          </p>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    {showFavorites && (
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(athlete.id) }}
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
                        title={isFavorite(athlete.id) ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        {isFavorite(athlete.id) ? (
                          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-gray-300 hover:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Selected athlete detail */}
      {selectedAthlete && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-navy-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-navy-700">
                    {selectedAthlete.first_name[0]}{selectedAthlete.last_name[0]}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-navy-900">
                    {selectedAthlete.first_name} {selectedAthlete.last_name}
                  </h2>
                  <div className="flex items-center space-x-2 mt-0.5 flex-wrap">
                    <span className={`badge ${selectedAthlete.level === 'JV' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                      {selectedAthlete.level}
                    </span>
                    <span className="badge bg-gray-100 text-gray-800">{selectedAthlete.gender}</span>
                    <span className="badge bg-navy-100 text-navy-800">
                      {(() => { const today = new Date().toISOString().split('T')[0]; const c = Object.keys(entriesByMeet).filter(meetId => { const m = meets.find(mt => mt.id === meetId); return m && m.date <= today; }).length; return `${c} ${c === 1 ? 'meet' : 'meets'}`; })()}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => clearAthlete()}
                className="p-2 hover:bg-gray-100 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Meet assignments */}
          {Object.keys(entriesByMeet).length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-400">No meet assignments found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(entriesByMeet).map(([meetId, meetEntries]) => {
                const meet = meets.find(m => m.id === meetId)
                if (!meet) return null
                const meetDate = new Date(meet.date + 'T00:00:00')

                return (
                  <Link
                    key={meetId}
                    to={teamPath(`/meets/${meetId}`)}
                    state={{ from: 'athlete-search', returnUrl: `${teamPath('/search')}?athlete=${selectedAthlete.id}${search ? `&q=${search}` : ''}` }}
                    className="card block hover:ring-2 hover:ring-navy-200 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-navy-900">{meet.name}</h3>
                        <p className="text-sm text-gray-500">
                          {meetDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          {meet.location && ` — ${meet.location}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="badge bg-navy-100 text-navy-700">{meetEntries.length} events</span>
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
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
                          {entry.events.name}
                          {entry.relay_leg ? ` (Leg ${entry.relay_leg})` : ''}
                        </span>
                      ))}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
