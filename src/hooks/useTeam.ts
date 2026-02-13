import { useTeamContext } from '../contexts/TeamContext'

/**
 * Hook to access current team data from URL context.
 * Must be used within a TeamProvider (i.e., under /t/:slug/* routes).
 */
export function useTeam() {
  const {
    team, teamId, teamSlug, loading, error,
    guestMode, setGuestMode,
    selectedSeasonId, setSelectedSeasonId,
    seasons, seasonsLoading, activeSeason,
  } = useTeamContext()

  return {
    team,
    teamId,
    teamSlug,
    loading,
    error,
    guestMode,
    setGuestMode,
    selectedSeasonId,
    setSelectedSeasonId,
    seasons,
    seasonsLoading,
    activeSeason,
  }
}

/**
 * Build a team-scoped path.
 * e.g. teamPath('/roster') => '/t/bishop-snyder/roster'
 */
export function useTeamPath() {
  const { teamSlug } = useTeamContext()

  return function teamPath(path: string = '') {
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    return `/t/${teamSlug}${cleanPath}`
  }
}
