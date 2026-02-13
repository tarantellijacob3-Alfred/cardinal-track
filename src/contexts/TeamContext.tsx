import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Team } from '../types/database'

interface TeamContextType {
  team: Team | null
  teamId: string | null
  teamSlug: string | null
  loading: boolean
  error: string | null
}

const TeamContext = createContext<TeamContextType | undefined>(undefined)

export function TeamProvider({ children }: { children: ReactNode }) {
  const { slug } = useParams<{ slug: string }>()
  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

      const { data, error: fetchError } = await supabase
        .from('teams')
        .select('*')
        .eq('slug', slug!)
        .eq('active', true)
        .single()

      if (fetchError || !data) {
        setTeam(null)
        setError('Team not found')
      } else {
        setTeam(data as Team)
      }
      setLoading(false)
    }

    fetchTeam()
  }, [slug])

  return (
    <TeamContext.Provider value={{
      team,
      teamId: team?.id ?? null,
      teamSlug: team?.slug ?? slug ?? null,
      loading,
      error,
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
