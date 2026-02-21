import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (resetError) {
      setError(resetError.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-gray-500 hover:text-navy-800 font-medium flex items-center gap-1"
          >
            ← Back
          </button>
        </div>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-navy-900 font-bold text-xl">TR</span>
          </div>
          <h1 className="text-3xl font-bold text-navy-900">Reset Password</h1>
          <p className="text-gray-500 mt-1">We'll send you a link to reset your password</p>
        </div>

        {sent ? (
          <div className="card space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 font-medium">Check your email!</p>
              <p className="text-green-600 text-sm mt-1">
                We sent a password reset link to <strong>{email}</strong>. 
                Click the link in the email to set a new password.
              </p>
            </div>
            <p className="text-center text-sm text-gray-500">
              Didn't get it? Check your spam folder or{' '}
              <button
                onClick={() => setSent(false)}
                className="text-navy-700 hover:text-navy-900 font-medium"
              >
                try again
              </button>
            </p>
            <Link
              to="/login"
              className="btn-primary w-full min-h-[44px] text-center block flex items-center justify-center"
            >
              Back to Sign In
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                required
                placeholder="coach@school.edu"
                autoFocus
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full min-h-[44px]">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <p className="text-center text-sm text-gray-500">
              Remember your password?{' '}
              <Link to="/login" className="text-navy-700 hover:text-navy-900 font-medium">
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
