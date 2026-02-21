import { useMemo } from 'react'
import { useTeamContext } from '../contexts/TeamContext'

export interface TrialStatus {
  /** Team has an active Stripe subscription */
  isPaid: boolean
  /** Team is grandfathered (free forever) */
  isGrandfathered: boolean
  /** Team is currently in trial period */
  isInTrial: boolean
  /** Trial has expired (no subscription, not grandfathered) */
  isExpired: boolean
  /** Days remaining in trial (0 if expired, null if paid/grandfathered) */
  daysRemaining: number | null
  /** Whether the team can edit data (paid, grandfathered, or in trial) */
  canEdit: boolean
  /** Human-readable status label */
  statusLabel: string
}

export function useTrialStatus(): TrialStatus {
  const { team } = useTeamContext()

  return useMemo(() => {
    if (!team) {
      return {
        isPaid: false,
        isGrandfathered: false,
        isInTrial: false,
        isExpired: false,
        daysRemaining: null,
        canEdit: false,
        statusLabel: 'Loading...',
      }
    }

    // Paid team
    if (team.stripe_subscription_id) {
      return {
        isPaid: true,
        isGrandfathered: false,
        isInTrial: false,
        isExpired: false,
        daysRemaining: null,
        canEdit: true,
        statusLabel: 'Active Subscription',
      }
    }

    // Grandfathered team (free forever)
    if (team.is_grandfathered) {
      return {
        isPaid: false,
        isGrandfathered: true,
        isInTrial: false,
        isExpired: false,
        daysRemaining: null,
        canEdit: true,
        statusLabel: 'Free Season',
      }
    }

    // Check trial
    if (team.trial_expires_at) {
      const now = new Date()
      const expires = new Date(team.trial_expires_at)
      const msRemaining = expires.getTime() - now.getTime()
      const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)))

      if (daysRemaining > 0) {
        return {
          isPaid: false,
          isGrandfathered: false,
          isInTrial: true,
          isExpired: false,
          daysRemaining,
          canEdit: true,
          statusLabel: `Trial: ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left`,
        }
      }

      // Trial expired
      return {
        isPaid: false,
        isGrandfathered: false,
        isInTrial: false,
        isExpired: true,
        daysRemaining: 0,
        canEdit: false,
        statusLabel: 'Trial Expired',
      }
    }

    // No trial set, no subscription, not grandfathered — treat as expired
    return {
      isPaid: false,
      isGrandfathered: false,
      isInTrial: false,
      isExpired: true,
      daysRemaining: 0,
      canEdit: false,
      statusLabel: 'No Subscription',
    }
  }, [team])
}
