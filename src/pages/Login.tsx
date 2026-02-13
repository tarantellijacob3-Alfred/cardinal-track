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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: err } = await signIn(email, password)
    if (err) {
      setError(err.message)
    } else {
      // After login, redirect to Bishop Snyder dashboard (or use profile.team_id in future)
      navigate('/t/bishop-snyder')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gold-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-navy-900 font-bold text-xl">BS</span>
          </div>
          <h1 className="text-3xl font-bold text-navy-900">Cardinal Track</h1>
          <p className="text-gray-500 mt-1">Sign in to your account</p>
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
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-navy-700 hover:text-navy-900 font-medium">
              Register
            </Link>
          </p>

          <div className="pt-2">
            <Link to="/t/bishop-snyder/meets" className="btn-secondary w-full text-center block min-h-[44px] flex items-center justify-center">
              Continue as parent or athlete
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
