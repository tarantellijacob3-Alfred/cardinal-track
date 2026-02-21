import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTeam, useTeamPath } from '../hooks/useTeam'
import { supabase } from '../lib/supabase'
import TeamSwitcher from '../components/TeamSwitcher'

export default function TeamRegister() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { signUp } = useAuth()
  const { team, teamId } = useTeam()
  const teamPath = useTeamPath()
  const navigate = useNavigate()

  const teamName = team?.name || 'Team'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: err } = await signUp(email, password, fullName, 'coach')
    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    // With email confirmation ON, the user won't have a session yet.
    // They need to verify email first, then sign in.
    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="card max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-navy-900">Check Your Email!</h2>
          <p className="mt-2 text-gray-600">
            We sent a confirmation link to <strong>{email}</strong>.
          </p>
          <p className="mt-2 text-gray-600">
            Click the link in the email to verify your account, then sign in.
            Your coach account will need approval from the head coach.
          </p>
          <Link to={teamPath('/login')} className="btn-primary inline-block mt-4">Go to Sign In</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-navy-900">Coach Registration</h1>
          <p className="text-gray-500 mt-1">Register as a coach for {teamName}</p>
        </div>

        <TeamSwitcher authPath="/register" />

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input"
              required
            />
          </div>

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

          <p className="text-xs text-brand-700 bg-brand-50 p-2 rounded">
            ⚠️ Coach accounts require approval before you can make changes.
          </p>

          <button type="submit" disabled={loading} className="btn-primary w-full min-h-[44px]">
            {loading ? 'Creating account...' : 'Register as Coach'}
          </button>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to={teamPath('/login')} className="text-navy-700 hover:text-navy-900 font-medium">
              Sign In
            </Link>
          </p>

          <p className="text-center text-sm text-gray-400">
            Parent or athlete?{' '}
            <Link to={teamPath('/parent-signup')} className="text-navy-600 hover:underline">
              Sign up here
            </Link>
          </p>

          <div className="pt-2 border-t border-gray-100">
            <Link to="/" className="block text-center text-sm text-gray-400 hover:text-gray-600">
              ← Back to TrackRoster
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
