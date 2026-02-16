import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTeam, useTeamPath } from '../hooks/useTeam'
import TeamSwitcher from '../components/TeamSwitcher'

export default function TeamParentSignup() {
  const navigate = useNavigate()
  const { team, teamId } = useTeam()
  const teamPath = useTeamPath()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const teamName = team?.name || 'Team'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Sign up
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
      if (signUpErr) throw signUpErr
      if (!data.user) throw new Error('Signup failed')

      // Update profile
      await supabase
        .from('profiles')
        .update({
          role: 'parent',
          approved: true,
          full_name: fullName,
          team_id: teamId || null,
        } as Record<string, unknown>)
        .eq('id', data.user.id)

      // Add to team_members
      if (teamId) {
        await supabase
          .from('team_members')
          .upsert({
            profile_id: data.user.id,
            team_id: teamId,
            role: 'parent',
            approved: true,
            is_owner: false,
          } as Record<string, unknown>, { onConflict: 'profile_id,team_id' })
      }

      setSuccess(true)
      setTimeout(() => navigate(teamPath('/')), 1500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-navy-900">Welcome!</h2>
          <p className="text-gray-500 mt-2">
            Your account has been created for <strong>{teamName}</strong>. Redirecting...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">👨‍👩‍👧‍👦</span>
          </div>
          <h1 className="text-3xl font-bold text-navy-900">Join {teamName}</h1>
          <p className="text-gray-500 mt-1">Create a free account to follow your favorite athletes</p>
        </div>

        <TeamSwitcher authPath="/parent-signup" />

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
              onChange={e => setFullName(e.target.value)}
              className="input"
              required
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input"
              required
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input"
              required
              minLength={6}
              placeholder="At least 6 characters"
            />
          </div>

          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
            You'll be signed up for <strong>{teamName}</strong>
            {team?.school_name ? ` (${team.school_name})` : ''}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full min-h-[44px]">
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to={teamPath('/login')} className="text-navy-700 hover:text-navy-900 font-medium">
              Sign In
            </Link>
          </p>

          <p className="text-center text-sm text-gray-400">
            Are you a coach?{' '}
            <Link to={teamPath('/register')} className="text-navy-600 hover:underline">
              Register as Coach
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
