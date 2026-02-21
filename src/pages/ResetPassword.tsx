import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [validLink, setValidLink] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Check if user arrived via a valid reset link (Supabase sets the session automatically)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setValidLink(false)
      }
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    })

    if (updateError) {
      setError(updateError.message)
    } else {
      setSuccess(true)
      // Redirect to login after 3 seconds
      setTimeout(() => navigate('/login'), 3000)
    }
    setLoading(false)
  }

  if (!validLink) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="card space-y-4">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-navy-900">Invalid or Expired Link</h2>
            <p className="text-gray-500 text-sm">
              This password reset link has expired or is invalid. Please request a new one.
            </p>
            <Link to="/forgot-password" className="btn-primary w-full min-h-[44px] text-center block flex items-center justify-center">
              Request New Link
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link
            to="/login"
            className="text-sm text-gray-500 hover:text-navy-800 font-medium flex items-center gap-1"
          >
            ← Back to Sign In
          </Link>
        </div>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-navy-900 font-bold text-xl">TR</span>
          </div>
          <h1 className="text-3xl font-bold text-navy-900">New Password</h1>
          <p className="text-gray-500 mt-1">Choose a new password for your account</p>
        </div>

        {success ? (
          <div className="card space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 font-medium">Password updated!</p>
              <p className="text-green-600 text-sm mt-1">
                Your password has been changed. Redirecting to sign in...
              </p>
            </div>
            <Link
              to="/login"
              className="btn-primary w-full min-h-[44px] text-center block flex items-center justify-center"
            >
              Sign In Now
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                required
                minLength={6}
                placeholder="••••••••"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
                required
                minLength={6}
                placeholder="••••••••"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full min-h-[44px]">
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
