import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useTeam, useTeamPath } from '../hooks/useTeam'
import { useFavorites } from '../hooks/useFavorites'
import type { Athlete, Meet, MeetEntryWithDetails } from '../types/database'

export default function MyFavorites() {
  const { user } = useAuth()
  const { team } = useTeam()
  const teamPath = useTeamPath()
  const { favorites, loading: favsLoading, toggleFavorite } = useFavorites()

  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [meets, setMeets] = useState<Meet[]>([])
  const [entries, setEntries] = useState<MeetEntryWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch all data for the team
  useEffect(() => {
    async function fetchData() {
      if (!team?.id) return
      setLoading(true)

      const [athletesRes, meetsRes, entriesRes] = await Promise.all([
        supabase.from('athletes').select('*').eq('team_id', team.id).eq('active', true),
        supabase.from('meets').select('*').eq('team_id', team.id).order('date', { ascending: true }),
        supabase.from('meet_entries').select('*, athletes(*), events(*)'),
      ])

      if (athletesRes.data) setAthletes(athletesRes.data as Athlete[])
      if (meetsRes.data) setMeets(meetsRes.data as Meet[])
      if (entriesRes.data) setEntries(entriesRes.data as unknown as MeetEntryWithDetails[])
      setLoading(false)
    }
    fetchData()
  }, [team?.id])

  // Filter to only favorited athletes
  const favoriteAthleteIds = useMemo(
    () => new Set(favorites.map(f => f.athlete_id)),
    [favorites]
  )

  const favoritedAthletes = useMemo(
    () => athletes.filter(a => favoriteAthleteIds.has(a.id)).sort((a, b) =>
      a.last_name.localeCompare(b.last_name) || a.first_name.localeCompare(b.first_name)
    ),
    [athletes, favoriteAthleteIds]
  )

  // Upcoming meets (today or later)
  const today = new Date().toISOString().split('T')[0]
  const upcomingMeets = useMemo(
    () => meets.filter(m => m.date >= today),
    [meets, today]
  )

  // Build upcoming entries for favorited athletes
  const upcomingByAthlete = useMemo(() => {
    const result: Record<string, { meet: Meet; events: string[] }[]> = {}
    const upcomingMeetIds = new Set(upcomingMeets.map(m => m.id))

    for (const entry of entries) {
      if (!favoriteAthleteIds.has(entry.athlete_id)) continue
      if (!upcomingMeetIds.has(entry.meet_id)) continue

      if (!result[entry.athlete_id]) result[entry.athlete_id] = []

      const existing = result[entry.athlete_id].find(r => r.meet.id === entry.meet_id)
      const eventName = entry.events?.short_name || entry.events?.name || 'Unknown'

      if (existing) {
        existing.events.push(eventName)
      } else {
        const meet = upcomingMeets.find(m => m.id === entry.meet_id)
        if (meet) {
          result[entry.athlete_id].push({ meet, events: [eventName] })
        }
      }
    }

    return result
  }, [entries, favoriteAthleteIds, upcomingMeets])

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-navy-900 mb-2">Sign In Required</h2>
        <p className="text-gray-500 mb-4">Sign in to see your favorite athletes.</p>
        <Link to="/login" className="btn-primary inline-block">Sign In</Link>
      </div>
    )
  }

  if (loading || favsLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-800" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">My Favorites</h1>
        <p className="text-gray-500 text-sm mt-1">Athletes you're following</p>
      </div>

      {favoritedAthletes.length === 0 ? (
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⭐</span>
          </div>
          <h3 className="text-lg font-semibold text-navy-900 mb-1">No favorites yet</h3>
          <p className="text-gray-500 mb-4">
            Search for athletes and tap the star to add them to your favorites.
          </p>
          <Link to={teamPath('/search')} className="btn-primary inline-block">
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

                  <button
                    onClick={() => toggleFavorite(athlete.id)}
                    className="p-2 text-yellow-500 hover:text-yellow-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title="Remove from favorites"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </button>
                </div>

                {/* Upcoming meets */}
                {upcoming.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-2">Upcoming Meets</p>
                    <div className="space-y-2">
                      {upcoming.map(({ meet, events }) => {
                        const d = new Date(meet.date + 'T00:00:00')
                        return (
                          <Link
                            key={meet.id}
                            to={teamPath(`/meets/${meet.id}`)}
                            className="block p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-navy-800">{meet.name}</p>
                                <p className="text-xs text-gray-500">
                                  {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  {meet.location && ` · ${meet.location}`}
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
  )
}
