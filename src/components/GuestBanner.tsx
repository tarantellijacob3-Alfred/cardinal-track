import { useTeam } from '../hooks/useTeam'
import { useAuth } from '../contexts/AuthContext'

/**
 * Shows a subtle banner when the user is viewing another team in guest mode.
 */
export default function GuestBanner() {
  const { team, guestMode } = useTeam()
  const { user } = useAuth()

  if (!guestMode || !user) return null

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center">
      <p className="text-sm text-amber-800">
        👀 Viewing <span className="font-semibold">{team?.name || 'this team'}</span> as guest
      </p>
    </div>
  )
}
