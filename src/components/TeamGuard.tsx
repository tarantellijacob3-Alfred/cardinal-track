import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTeam } from '../hooks/useTeam'

/**
 * TeamGuard checks if a logged-in user is viewing a team they're not a member of.
 * If so, it shows a modal asking them to continue as guest or go back.
 * Renders nothing if the user is a member of this team or not logged in.
 */
export default function TeamGuard() {
  const { user, memberships } = useAuth()
  const { team, teamId, guestMode, setGuestMode } = useTeam()
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    // Only check if user is logged in and team is loaded
    if (!user || !teamId) {
      setShowModal(false)
      return
    }

    // If they have a membership for this team, no warning needed
    const isMember = memberships.some(m => m.team_id === teamId)
    if (isMember) {
      setShowModal(false)
      return
    }

    // If they have no memberships at all (brand new user), no warning
    if (memberships.length === 0) {
      setShowModal(false)
      return
    }

    // If already in guest mode, don't show again
    if (guestMode) {
      return
    }

    // They're on a team they're not a member of — show modal
    setShowModal(true)
  }, [user, memberships, teamId, guestMode, setGuestMode])

  if (!showModal) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
        <div className="text-center">
          <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-navy-900 mb-2">Not Your Team</h2>
          <p className="text-gray-600 mb-6">
            You're not a member of <span className="font-semibold text-navy-800">{team?.name || 'this team'}</span>.
            You can browse as a guest (view only).
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors min-h-[44px]"
            >
              Go Back
            </button>
            <button
              onClick={() => {
                setGuestMode(true)
                setShowModal(false)
              }}
              className="flex-1 px-4 py-3 rounded-xl bg-navy-800 text-white font-medium hover:bg-navy-900 transition-colors min-h-[44px]"
            >
              View as Guest
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
