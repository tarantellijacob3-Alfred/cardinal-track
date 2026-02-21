import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: err } = await signIn(email, password)
    if (err) {
      setError(err.message)
    } else {
      // After login, redirect to landing (team directory) — user picks their team
      navigate('/')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <button
            onClick={goBack}
            className="text-sm text-gray-500 hover:text-navy-800 font-medium flex items-center gap-1"
          >
            ← Back
          </button>
        </div>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-navy-900 font-bold text-xl">BS</span>
          </div>
          <h1 className="text-3xl font-bold text-navy-900">TrackRoster</h1>
          <p className="text-gray-500 mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
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

          <p className="text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-navy-700 hover:text-navy-900 font-medium">
              Register as Coach
            </Link>
          </p>

          <div className="pt-2">
            <Link to="/parent-signup" className="btn-secondary w-full text-center block min-h-[44px] flex items-center justify-center">
              Sign up as Parent / Athlete
            </Link>
          </div>

          <p className="text-center text-sm text-gray-400">
            Or <Link to="/t/bishop-snyder/search" className="text-navy-600 hover:underline">search athletes</Link> without an account
          </p>
        </form>
      </div>
    </div>
  )
}
