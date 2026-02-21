import { useTrialStatus } from '../hooks/useTrialStatus'
import { useAuth } from '../contexts/AuthContext'
import { useTeamContext } from '../contexts/TeamContext'

const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/8x25kw7EL7dB6pl7kR48005'

/**
 * Full-page overlay that blocks interaction when trial is expired.
 * Shows on top of the team content with a paywall message.
 * Only blocks write actions — team data is still visible behind it.
 */
export default function TrialExpiredOverlay() {
  const { isExpired } = useTrialStatus()
  const { isCoachForTeam } = useAuth()
  const { team } = useTeamContext()

  const isTeamCoach = isCoachForTeam(team?.id ?? null)

  if (!isExpired || !team || !isTeamCoach) return null

  return (
    <div className="fixed inset-0 z-[55] pointer-events-none">
      {/* Subtle overlay that doesn't completely block viewing */}
      <div className="absolute inset-0 bg-gray-900/10" />
      
      {/* Floating paywall card at bottom */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-auto">
        <div className="max-w-lg mx-auto px-4 pb-6">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">🔒</span>
              </div>
              <h3 className="text-lg font-bold text-navy-900 mb-1">Trial Ended</h3>
              <p className="text-gray-500 text-sm mb-4">
                {isTeamCoach
                  ? 'Your 14-day free trial has ended. Subscribe to restore full access — your data is safe and waiting.'
                  : 'This team\'s trial has ended. Ask your coach to subscribe to continue using TrackRoster.'}
              </p>
              {isTeamCoach && (
                <a
                  href={`${STRIPE_PAYMENT_LINK}?client_reference_id=${team.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block w-full px-6 py-3 bg-navy-800 text-white font-semibold rounded-xl hover:bg-navy-900 transition-colors"
                >
                  Subscribe — $300/year
                </a>
              )}
              <p className="text-xs text-gray-400 mt-3">
                Your roster, meets, and all data are preserved. You can still view everything.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
