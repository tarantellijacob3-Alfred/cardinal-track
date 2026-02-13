import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useMeets } from '../hooks/useMeets'
import { useAthletes } from '../hooks/useAthletes'
import { useTeam, useTeamPath } from '../hooks/useTeam'
import MeetCard from '../components/MeetCard'
import SearchBar from '../components/SearchBar'
import AthleteCard from '../components/AthleteCard'

export default function Dashboard() {
  const { user, isCoach, profile } = useAuth()
  const { meets, loading: meetsLoading } = useMeets()
  const { athletes, loading: athletesLoading } = useAthletes()
  const { team } = useTeam()
  const teamPath = useTeamPath()
  const [search, setSearch] = useState('')

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

  const loading = meetsLoading || athletesLoading

  const teamName = team?.name || 'Cardinal Track'
  const schoolLabel = team?.school_name || 'Track & Field'

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="bg-gradient-to-br from-navy-800 to-navy-950 rounded-2xl p-6 sm:p-8 text-white">
        <h1 className="text-3xl sm:text-4xl font-bold">{teamName}</h1>
        <p className="text-gold-400 mt-1 text-lg">{schoolLabel} Meet Manager</p>
        {!user && (
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/login" className="btn-secondary">Sign In</Link>
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
