import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Team } from '../types/database'

export default function JoinTeam() {
  const navigate = useNavigate()
  const { user, profile, refreshProfile } = useAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchTeams() {
      const { data } = await supabase
        .from('teams')
        .select('*')
        .eq('active', true)
        .order('name')

      if (data) setTeams(data as Team[])
      setLoading(false)
    }
    fetchTeams()
  }, [])

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-navy-900 mb-2">Sign In Required</h2>
          <p className="text-gray-500 mb-4">You need an account to join a team.</p>
          <Link to="/login" className="btn-primary inline-block">Sign In</Link>
          <p className="mt-2 text-sm text-gray-400">
            or <Link to="/parent-signup" className="text-navy-600 hover:underline">create an account</Link>
          </p>
        </div>
      </div>
    )
  }

  const handleJoin = async (team: Team) => {
    setError('')
    setJoining(true)

    try {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ team_id: team.id } as Record<string, unknown>)
        .eq('id', user.id)

      if (updateErr) throw updateErr

      await refreshProfile()
      navigate(`/t/${team.slug}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to join team')
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-800" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-navy-900">Join a Team</h1>
          <p className="text-gray-500 mt-1">
            {profile?.team_id
              ? 'Switch to a different team'
              : 'Select a team to follow'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-cardinal-50 border border-cardinal-200 rounded-lg text-cardinal-700 text-sm">
            {error}
          </div>
        )}

        {teams.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-gray-400">No teams available yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {teams.map(team => {
              const isCurrent = profile?.team_id === team.id
              return (
                <div
                  key={team.id}
                  className={`card flex items-center justify-between ${
                    isCurrent ? 'ring-2 ring-gold-400 bg-gold-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                      style={{ backgroundColor: team.primary_color }}
                    >
                      {team.logo_url ? (
                        <img src={team.logo_url} alt={team.name} className="w-12 h-12 rounded-full object-contain" />
                      ) : (
                        team.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-navy-900">{team.name}</h3>
                      <p className="text-sm text-gray-500">{team.school_name}</p>
                    </div>
                  </div>

                  {isCurrent ? (
                    <span className="text-sm font-medium text-gold-600 bg-gold-100 px-3 py-1 rounded-full">
                      Current
                    </span>
                  ) : (
                    <button
                      onClick={() => handleJoin(team)}
                      disabled={joining}
                      className="btn-primary text-sm min-h-[44px]"
                    >
                      {joining ? '...' : 'Join'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-navy-600 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
