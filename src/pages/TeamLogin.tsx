import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTeam, useTeamPath } from '../hooks/useTeam'
import TeamSwitcher from '../components/TeamSwitcher'

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

  // Track team changes for morph animation
  const [morphing, setMorphing] = useState(false)
  const prevSlugRef = useRef(teamSlug)

  useEffect(() => {
    if (prevSlugRef.current && prevSlugRef.current !== teamSlug) {
      setMorphing(true)
      const timer = setTimeout(() => setMorphing(false), 500)
      return () => clearTimeout(timer)
    }
    prevSlugRef.current = teamSlug
  }, [teamSlug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: err } = await signIn(email, password)
    if (err) {
      setError(err.message)
    } else {
      navigate(teamPath('/'))
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div
          key={teamSlug}
          className="text-center mb-6"
          style={{
            animation: morphing ? 'teamMorph 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' : undefined,
          }}
        >
          <div
            className="inline-block"
            style={{
              animation: morphing ? 'logoMorph 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' : undefined,
            }}
          >
            {team?.logo_url ? (
              <img src={team.logo_url} alt={teamName} className="w-16 h-16 object-contain mx-auto mb-4" />
            ) : (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors duration-500"
                style={{ backgroundColor: team?.primary_color || '#1e3a5f' }}
              >
                <span className="text-white font-bold text-xl">
                  {teamName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <h1 className="text-3xl font-bold text-navy-900">{teamName}</h1>
          {schoolName && <p className="text-gray-500 mt-1">{schoolName}</p>}
        </div>

        <TeamSwitcher authPath="/login" />

        {/* Sign in form */}
        <form onSubmit={handleSubmit} className="card space-y-4 mb-4">
          <h2 className="text-lg font-semibold text-navy-900">Sign In</h2>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
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
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <Link to="/forgot-password" className="text-xs text-navy-600 hover:text-navy-800 font-medium">
                Forgot password?
              </Link>
            </div>
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
        </form>

        {/* Action buttons — clean grid, no emojis */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Link
            to={teamPath('/register')}
            className="flex items-center justify-center px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-navy-800 hover:bg-gray-50 hover:border-navy-300 transition-colors text-center"
          >
            Join as Coach
          </Link>
          <Link
            to={teamPath('/parent-signup')}
            className="flex items-center justify-center px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-navy-800 hover:bg-gray-50 hover:border-navy-300 transition-colors text-center"
          >
            Join as Parent
          </Link>
          <Link
            to={teamPath('/search')}
            className="flex items-center justify-center px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-navy-800 hover:bg-gray-50 hover:border-navy-300 transition-colors text-center"
          >
            Find Athletes
          </Link>
          <a
            href="/onboard"
            className="flex items-center justify-center px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-brand-700 hover:bg-brand-50 hover:border-brand-300 transition-colors text-center"
          >
            Create a Team
          </a>
        </div>

        <div className="text-center">
          <Link to="/" className="text-sm text-gray-400 hover:text-gray-600">
            ← Back to TrackRoster
          </Link>
        </div>
      </div>
    </div>
  )
}
