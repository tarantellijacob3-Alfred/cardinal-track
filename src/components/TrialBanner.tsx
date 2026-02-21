import { useTrialStatus } from '../hooks/useTrialStatus'
import { useAuth } from '../contexts/AuthContext'
import { useTeamContext } from '../contexts/TeamContext'

const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/8x25kw7EL7dB6pl7kR48005'

export default function TrialBanner() {
  const { isCoachForTeam } = useAuth()
  const { team } = useTeamContext()
  const { isInTrial, isExpired, daysRemaining, isPaid, isGrandfathered } = useTrialStatus()

  const isTeamCoach = isCoachForTeam(team?.id ?? null)

  // Don't show banner if paid, grandfathered, or not a coach on THIS team
  if (isPaid || isGrandfathered || !team || !isTeamCoach) return null

  // Trial warning (last 5 days)
  if (isInTrial && daysRemaining !== null && daysRemaining <= 5) {
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-amber-800 text-sm font-medium text-center sm:text-left">
            ⏰ Your free trial ends in {daysRemaining} day{daysRemaining === 1 ? '' : 's'}.
            {isTeamCoach ? ' Subscribe to keep full access.' : ''}
          </p>
          {isTeamCoach && (
            <a
              href={`${STRIPE_PAYMENT_LINK}?client_reference_id=${team.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 px-4 py-1.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
            >
              Subscribe — $300/year
            </a>
          )}
        </div>
      </div>
    )
  }

  // Trial expired
  if (isExpired) {
    return (
      <div className="bg-red-50 border-b border-red-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-3">
          <div className="text-center">
            <p className="text-red-800 font-semibold">
              🔒 Your free trial has ended
            </p>
            <p className="text-red-600 text-sm mt-1">
              {isTeamCoach
                ? 'Your team is in view-only mode. Subscribe to restore full access to editing, meet entries, and more.'
                : 'This team\'s trial has ended. Contact your coach to subscribe.'}
            </p>
          </div>
          {isTeamCoach && (
            <a
              href={`${STRIPE_PAYMENT_LINK}?client_reference_id=${team.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Subscribe Now — $300/year
            </a>
          )}
        </div>
      </div>
    )
  }

  return null
}
