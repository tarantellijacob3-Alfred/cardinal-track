import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useMeets } from '../hooks/useMeets'
import { useAthletes } from '../hooks/useAthletes'
import { useTeam, useTeamPath } from '../hooks/useTeam'
import { useFavorites } from '../hooks/useFavorites'
import { supabase } from '../lib/supabase'
import MeetCard from '../components/MeetCard'
import SearchBar from '../components/SearchBar'
import AthleteCard from '../components/AthleteCard'
import type { MeetEntryWithDetails } from '../types/database'

export default function Dashboard() {
  const { user, isCoach, profile } = useAuth()
  const { meets, loading: meetsLoading } = useMeets()
  const { athletes, loading: athletesLoading } = useAthletes()
  const { team } = useTeam()
  const teamPath = useTeamPath()
  const { favorites, loading: favsLoading } = useFavorites()
  const [search, setSearch] = useState('')
  const [entries, setEntries] = useState<MeetEntryWithDetails[]>([])
  const [entriesLoading, setEntriesLoading] = useState(false)

  const isParentOrAthlete = user && !isCoach

  // Fetch meet entries for favorited athletes
  const favoriteAthleteIds = useMemo(
    () => new Set(favorites.map(f => f.athlete_id)),
    [favorites]
  )

  useEffect(() => {
    if (favoriteAthleteIds.size === 0 || !team?.id) {
      setEntries([])
      return
    }

    async function fetchEntries() {
      setEntriesLoading(true)
      const { data } = await supabase
        .from('meet_entries')
        .select('*, athletes(*), events(*)')

      if (data) setEntries(data as unknown as MeetEntryWithDetails[])
      setEntriesLoading(false)
    }
    fetchEntries()
  }, [favoriteAthleteIds.size, team?.id])

  const upcomingMeets = useMemo(() => {
    const today = new Date(new Date().toDateString())
    return meets.filter(m => new Date(m.date + 'T00:00:00') >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5)
  }, [meets])

  const recentMeets = useMemo(() => {
    const today = new Date(new Date().toDateString())
    return meets.filter(m => new Date(m.date + 'T00:00:00') < today)
      .slice(0, 3)
  }, [meets])

  const filteredAthletes = useMemo(() => {
    if (!search) return []
    const q = search.toLowerCase()
    return athletes.filter(a =>
      a.first_name.toLowerCase().includes(q) ||
      a.last_name.toLowerCase().includes(q) ||
      `${a.last_name} ${a.first_name}`.toLowerCase().includes(q) ||
      `${a.first_name} ${a.last_name}`.toLowerCase().includes(q)
    ).slice(0, 10)
  }, [athletes, search])

  // Favorited athletes data
  const favoritedAthletes = useMemo(
    () => athletes.filter(a => favoriteAthleteIds.has(a.id)).sort((a, b) =>
      a.last_name.localeCompare(b.last_name) || a.first_name.localeCompare(b.first_name)
    ),
    [athletes, favoriteAthleteIds]
  )

  // Build upcoming entries for favorited athletes
  const today = new Date().toISOString().split('T')[0]
  const upcomingByAthlete = useMemo(() => {
    const result: Record<string, { meetId: string; meetName: string; meetDate: string; meetLocation: string | null; events: string[] }[]> = {}
    const upcomingMeetIds = new Set(meets.filter(m => m.date >= today).map(m => m.id))

    for (const entry of entries) {
      if (!favoriteAthleteIds.has(entry.athlete_id)) continue
      if (!upcomingMeetIds.has(entry.meet_id)) continue

      if (!result[entry.athlete_id]) result[entry.athlete_id] = []

      const existing = result[entry.athlete_id].find(r => r.meetId === entry.meet_id)
      const eventName = entry.events?.short_name || entry.events?.name || 'Unknown'

      if (existing) {
        existing.events.push(eventName)
      } else {
        const meet = meets.find(m => m.id === entry.meet_id)
        if (meet) {
          result[entry.athlete_id].push({
            meetId: meet.id,
            meetName: meet.name,
            meetDate: meet.date,
            meetLocation: meet.location,
            events: [eventName],
          })
        }
      }
    }
    return result
  }, [entries, favoriteAthleteIds, meets, today])

  const loading = meetsLoading || athletesLoading

  const teamName = team?.name || 'Track Team'
  const schoolLabel = team?.school_name || 'Track & Field'

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="bg-gradient-to-br from-navy-800 to-navy-950 rounded-2xl p-6 sm:p-8 text-white">
        <h1 className="text-3xl sm:text-4xl font-bold">{teamName}</h1>
        <p className="text-gold-400 mt-1 text-lg">{schoolLabel} Meet Manager</p>
        {!user && (
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to={teamPath('/login')} className="btn-secondary">Sign In</Link>
            <Link to={teamPath('/search')} className="btn-ghost text-white hover:bg-navy-700">Search Athletes</Link>
          </div>
        )}
        {user && isCoach && (
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to={teamPath('/meets')} className="btn-secondary">Manage Meets</Link>
            <Link to={teamPath('/roster')} className="btn-ghost text-white hover:bg-navy-700">View Roster</Link>
          </div>
        )}
      </div>

      {user && !isCoach && profile?.role === 'coach' && !profile?.approved && (
        <div className="card border border-gold-200 bg-gold-50 text-navy-900">
          <p className="font-medium">Coach approval pending</p>
          <p className="text-sm text-gray-700 mt-1">
            You have view-only access until an admin approves your account.
          </p>
        </div>
      )}

      {/* ═══ My Athletes (Favorites on Dashboard) ═══ */}
      {isParentOrAthlete && !favsLoading && !entriesLoading && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-navy-900">⭐ My Athletes</h2>
            {favoritedAthletes.length > 0 && (
              <Link to={teamPath('/search')} className="text-sm text-navy-600 hover:text-navy-800 font-medium">
                + Add more
              </Link>
            )}
          </div>

          {favoritedAthletes.length === 0 ? (
            <div className="card border border-dashed border-gray-300 bg-gray-50 text-center py-8">
              <span className="text-4xl mb-3 block">⭐</span>
              <h3 className="text-base font-semibold text-navy-900 mb-1">
                Favorite athletes to see their updates here
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Search for athletes and tap the star to follow them. You'll see their upcoming meets and events right on this dashboard.
              </p>
              <Link to={teamPath('/search')} className="btn-primary inline-block text-sm">
                Search Athletes
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {favoritedAthletes.map(athlete => {
                const upcoming = upcomingByAthlete[athlete.id] || []

                return (
                  <div key={athlete.id} className="card">
                    <div className="flex items-start justify-between">
                      <Link
                        to={teamPath(`/athletes/${athlete.id}`)}
                        className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
                      >
                        <div className="w-12 h-12 bg-navy-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-navy-700">
                            {athlete.first_name[0]}{athlete.last_name[0]}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-navy-900">
                            {athlete.first_name} {athlete.last_name}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              athlete.level === 'JV' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                            }`}>
                              {athlete.level}
                            </span>
                            <span className="text-xs text-gray-500">{athlete.gender}</span>
                            {athlete.grade && (
                              <span className="text-xs text-gray-500">Grade {athlete.grade}</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </div>

                    {/* Upcoming meets for this athlete */}
                    {upcoming.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-500 mb-2">Upcoming Meets</p>
                        <div className="space-y-2">
                          {upcoming.map(({ meetId, meetName, meetDate, meetLocation, events }) => {
                            const d = new Date(meetDate + 'T00:00:00')
                            return (
                              <Link
                                key={meetId}
                                to={teamPath(`/meets/${meetId}`)}
                                className="block p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-navy-800">{meetName}</p>
                                    <p className="text-xs text-gray-500">
                                      {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                      {meetLocation && ` · ${meetLocation}`}
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap gap-1 justify-end">
                                    {events.map((ev, i) => (
                                      <span key={i} className="text-xs bg-navy-100 text-navy-700 px-2 py-0.5 rounded-full">
                                        {ev}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {upcoming.length === 0 && (
                      <p className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                        No upcoming meets
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Quick Search */}
      <div>
        <h2 className="text-lg font-semibold text-navy-900 mb-3">Quick Athlete Search</h2>
        <SearchBar value={search} onChange={setSearch} placeholder="Type an athlete's name..." />
        {filteredAthletes.length > 0 && (
          <div className="card mt-2">
            {filteredAthletes.map(a => (
              <AthleteCard key={a.id} athlete={a} />
            ))}
          </div>
        )}
        {search && filteredAthletes.length === 0 && !loading && (
          <p className="text-sm text-gray-400 mt-2 text-center">No athletes found for &quot;{search}&quot;</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-navy-800">{athletes.filter(a => a.active).length}</p>
          <p className="text-sm text-gray-500">Active Athletes</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-navy-800">{meets.length}</p>
          <p className="text-sm text-gray-500">Total Meets</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-gold-600">{upcomingMeets.length}</p>
          <p className="text-sm text-gray-500">Upcoming</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-600">{athletes.filter(a => a.level === 'JV').length}</p>
          <p className="text-sm text-gray-500">JV Athletes</p>
        </div>
      </div>

      {/* Upcoming Meets */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-navy-900">Upcoming Meets</h2>
          <Link to={teamPath('/meets')} className="text-sm text-navy-600 hover:text-navy-800 font-medium">View all →</Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-800" />
          </div>
        ) : upcomingMeets.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-gray-400">No upcoming meets scheduled</p>
            {isCoach && (
              <Link to={teamPath('/meets')} className="btn-primary inline-block mt-3 text-sm">Create Meet</Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingMeets.map(meet => (
              <MeetCard key={meet.id} meet={meet} />
            ))}
          </div>
        )}
      </div>

      {/* Recent Meets */}
      {recentMeets.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-navy-900 mb-3">Recent Meets</h2>
          <div className="space-y-3">
            {recentMeets.map(meet => (
              <MeetCard key={meet.id} meet={meet} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
