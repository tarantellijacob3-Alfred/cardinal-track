import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTeam, useTeamPath } from '../hooks/useTeam'

export default function TeamLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const { team, teamSlug } = useTeam()
  const teamPath = useTeamPath()
  const navigate = useNavigate()

  const teamName = team?.name || 'Team'
  const schoolName = team?.school_name || ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: err } = await signIn(email, password)
    if (err) {
      setError(err.message)
    } else {
      // Redirect to team dashboard
      navigate(teamPath('/'))
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          {team?.logo_url ? (
            <img src={team.logo_url} alt={teamName} className="w-16 h-16 object-contain mx-auto mb-4" />
          ) : (
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: team?.primary_color || '#1e3a5f' }}
            >
              <span className="text-white font-bold text-xl">
                {teamName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
          <h1 className="text-3xl font-bold text-navy-900">{teamName}</h1>
          <p className="text-gray-500 mt-1">
            {schoolName ? `${schoolName} — ` : ''}Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && (
            <div className="p-3 bg-cardinal-50 border border-cardinal-200 rounded-lg text-cardinal-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              required
              minLength={6}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full min-h-[44px]">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="text-center text-sm text-gray-500">
            Coach?{' '}
            <Link to={teamPath('/register')} className="text-navy-700 hover:text-navy-900 font-medium">
              Register as Coach
            </Link>
          </p>

          <div className="pt-2">
            <Link to={teamPath('/parent-signup')} className="btn-secondary w-full text-center block min-h-[44px] flex items-center justify-center">
              Sign up as Parent / Athlete
            </Link>
          </div>

          <p className="text-center text-sm text-gray-400">
            Or <Link to={teamPath('/search')} className="text-navy-600 hover:underline">search athletes</Link> without an account
          </p>

          <div className="pt-2 border-t border-gray-100">
            <Link to="/" className="block text-center text-sm text-gray-400 hover:text-gray-600">
              ← Back to TrackBoard
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
