import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Season, SeasonInsert, SeasonUpdate } from '../types/database'
import { useTeam } from './useTeam'

export function useSeasons() {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [loading, setLoading] = useState(true)
  const { teamId } = useTeam()

  const fetch = useCallback(async () => {
    if (!teamId) {
      setSeasons([])
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('seasons')
      .select('*')
      .eq('team_id', teamId)
      .order('start_date', { ascending: false })

    if (!error && data) {
      setSeasons(data as Season[])
    }
    setLoading(false)
  }, [teamId])

  useEffect(() => {
    fetch()
  }, [fetch])

  const activeSeason = seasons.find(s => s.is_active) ?? null

  async function addSeason(season: Omit<SeasonInsert, 'team_id'>) {
    if (!teamId) return { data: null, error: new Error('No team context') }

    const { data, error } = await supabase
      .from('seasons')
      .insert({ ...season, team_id: teamId } as Record<string, unknown>)
      .select()
      .single()

    if (!error && data) {
      const newSeason = data as Season
      setSeasons(prev => [newSeason, ...prev].sort((a, b) =>
        new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      ))
    }
    return { data: data as Season | null, error }
  }

  async function updateSeason(id: string, updates: SeasonUpdate) {
    const { data, error } = await supabase
      .from('seasons')
      .update(updates as Record<string, unknown>)
      .eq('id', id)
      .select()
      .single()

    if (!error && data) {
      const updated = data as Season
      setSeasons(prev => prev.map(s => s.id === id ? updated : s))
    }
    return { data: data as Season | null, error }
  }

  async function deleteSeason(id: string) {
    const { error } = await supabase
      .from('seasons')
      .delete()
      .eq('id', id)

    if (!error) {
      setSeasons(prev => prev.filter(s => s.id !== id))
    }
    return { error }
  }

  async function setActiveSeason(id: string) {
    if (!teamId) return { error: new Error('No team context') }

    // Deactivate all seasons for this team first
    await supabase
      .from('seasons')
      .update({ is_active: false } as Record<string, unknown>)
      .eq('team_id', teamId)

    // Activate the chosen one
    const { error } = await supabase
      .from('seasons')
      .update({ is_active: true } as Record<string, unknown>)
      .eq('id', id)

    if (!error) {
      setSeasons(prev => prev.map(s => ({
        ...s,
        is_active: s.id === id
      })))
    }
    return { error }
  }

  return {
    seasons, loading, activeSeason,
    refetch: fetch, addSeason, updateSeason, deleteSeason, setActiveSeason
  }
}
