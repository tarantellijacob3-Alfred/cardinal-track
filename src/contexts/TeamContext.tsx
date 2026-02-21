import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Team, Season } from '../types/database'

interface TeamContextType {
  team: Team | null
  teamId: string | null
  teamSlug: string | null
  loading: boolean
  error: string | null
  // Guest mode: when a logged-in user views another team
  guestMode: boolean
  setGuestMode: (v: boolean) => void
  // Season selection
  selectedSeasonId: string | null
  setSelectedSeasonId: (id: string | null) => void
  seasons: Season[]
  seasonsLoading: boolean
  activeSeason: Season | null
}

const TeamContext = createContext<TeamContextType | undefined>(undefined)

export function TeamProvider({ children }: { children: ReactNode }) {
  const { slug } = useParams<{ slug: string }>()
  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [guestMode, setGuestMode] = useState(false)

  // Seasons state
  const [seasons, setSeasons] = useState<Season[]>([])
  const [seasonsLoading, setSeasonsLoading] = useState(true)
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null)

  const activeSeason = seasons.find(s => s.is_active) ?? null

  useEffect(() => {
    if (!slug) {
      setTeam(null)
      setLoading(false)
      setError(null)
      return
    }

    async function fetchTeam() {
      setLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await supabase
          .from('teams')
          .select('*')
          .eq('slug', slug!)
          .eq('active', true)
          .single()

        if (fetchError) {
          // Distinguish between "not found" and "network/auth error"
          if (fetchError.code === 'PGRST116') {
            setTeam(null)
            setError('Team not found')
          } else {
            console.warn('Team fetch error:', fetchError.message)
            setTeam(null)
            setError('Failed to load team. Please refresh the page.')
          }
        } else if (!data) {
          setTeam(null)
          setError('Team not found')
        } else {
          setTeam(data as Team)
        }
      } catch (err) {
        console.error('Team fetch exception:', err)
        setTeam(null)
        setError('Connection error. Please check your internet and refresh.')
      }
      setLoading(false)
    }

    fetchTeam()
  }, [slug])

  // Fetch seasons when team loads
  useEffect(() => {
    if (!team?.id) {
      setSeasons([])
      setSeasonsLoading(false)
      return
    }

    async function fetchSeasons() {
      setSeasonsLoading(true)
      const { data, error: fetchError } = await supabase
        .from('seasons')
        .select('*')
        .eq('team_id', team!.id)
        .order('start_date', { ascending: false })

      if (!fetchError && data) {
        const seasonsList = data as Season[]
        setSeasons(seasonsList)
        // Default to active season
        const active = seasonsList.find(s => s.is_active)
        if (active) {
          setSelectedSeasonId(active.id)
        } else if (seasonsList.length > 0) {
          setSelectedSeasonId(seasonsList[0].id)
        }
      }
      setSeasonsLoading(false)
    }

    fetchSeasons()
  }, [team?.id])

  // Reset guest mode when team changes
  useEffect(() => {
    setGuestMode(false)
  }, [slug])

  return (
    <TeamContext.Provider value={{
      team,
      teamId: team?.id ?? null,
      teamSlug: team?.slug ?? slug ?? null,
      loading,
      error,
      guestMode,
      setGuestMode,
      selectedSeasonId,
      setSelectedSeasonId,
      seasons,
      seasonsLoading,
      activeSeason,
    }}>
      {children}
    </TeamContext.Provider>
  )
}

export function useTeamContext() {
  const context = useContext(TeamContext)
  if (context === undefined) {
    throw new Error('useTeamContext must be used within a TeamProvider')
  }
  return context
}
