import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Athlete, AthleteInsert, AthleteUpdate } from '../types/database'
import { useTeam } from './useTeam'
import { useTrialStatus } from './useTrialStatus'

export function useAthletes() {
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [loading, setLoading] = useState(true)
  const { teamId } = useTeam()
  const { canEdit } = useTrialStatus()

  const fetch = useCallback(async (silent = false) => {
    if (!teamId) {
      setAthletes([])
      setLoading(false)
      return
    }

    if (!silent) setLoading(true)
    const { data, error } = await supabase
      .from('athletes')
      .select('*')
      .eq('team_id', teamId)
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true })

    if (!error && data) {
      setAthletes(data as Athlete[])
    }
    if (!silent) setLoading(false)
  }, [teamId])

  useEffect(() => {
    fetch()
  }, [fetch])

  async function addAthlete(athlete: Omit<AthleteInsert, 'team_id'>) {
    if (!canEdit) return { data: null, error: new Error('Trial expired. Subscribe to add athletes.') }
    if (!teamId) return { data: null, error: new Error('No team context') }

    const { data, error } = await supabase
      .from('athletes')
      .insert({ ...athlete, team_id: teamId } as Record<string, unknown>)
      .select()
      .single()

    if (!error && data) {
      const newAthlete = data as Athlete
      setAthletes(prev => [...prev, newAthlete].sort((a, b) =>
        a.last_name.localeCompare(b.last_name) || a.first_name.localeCompare(b.first_name)
      ))
    }
    return { data: data as Athlete | null, error }
  }

  async function updateAthlete(id: string, updates: AthleteUpdate) {
    if (!canEdit) return { data: null, error: new Error('Trial expired. Subscribe to edit athletes.') }
    const { data, error } = await supabase
      .from('athletes')
      .update(updates as Record<string, unknown>)
      .eq('id', id)
      .select()
      .single()

    if (!error && data) {
      const updated = data as Athlete
      setAthletes(prev => prev.map(a => a.id === id ? updated : a))
    }
    return { data: data as Athlete | null, error }
  }

  async function deleteAthlete(id: string) {
    if (!canEdit) return { error: new Error('Trial expired. Subscribe to delete athletes.') }
    const { error, count } = await supabase
      .from('athletes')
      .delete({ count: 'exact' })
      .eq('id', id)

    if (error) {
      console.error('Failed to delete athlete:', error)
      return { error }
    }

    if (count === 0) {
      console.warn('Delete athlete: 0 rows affected (RLS block?), id:', id)
    }

    // Update local state then silently re-fetch to confirm
    setAthletes(prev => prev.filter(a => a.id !== id))
    await fetch(true)
    return { error }
  }

  async function bulkAddAthletes(newAthletes: Omit<AthleteInsert, 'team_id'>[]) {
    if (!canEdit) return { added: [], errors: [{ index: 0, error: 'Trial expired. Subscribe to add athletes.' }] }
    if (!teamId) return { added: [], errors: [{ index: 0, error: 'No team context' }] }

    const results: Athlete[] = []
    const errors: Array<{ index: number; error: unknown }> = []
    for (let i = 0; i < newAthletes.length; i++) {
      const { data, error } = await supabase
        .from('athletes')
        .insert({ ...newAthletes[i], team_id: teamId } as Record<string, unknown>)
        .select()
        .single()
      if (!error && data) {
        results.push(data as Athlete)
      } else {
        errors.push({ index: i, error })
      }
    }
    if (results.length > 0) {
      setAthletes(prev =>
        [...prev, ...results].sort((a, b) =>
          a.last_name.localeCompare(b.last_name) || a.first_name.localeCompare(b.first_name)
        )
      )
    }
    return { added: results, errors }
  }

  return { athletes, loading, refetch: fetch, addAthlete, bulkAddAthletes, updateAthlete, deleteAthlete }
}

export function useAthlete(id: string | undefined) {
  const [athlete, setAthlete] = useState<Athlete | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    async function fetchAthlete() {
      setLoading(true)
      const { data } = await supabase
        .from('athletes')
        .select('*')
        .eq('id', id!)
        .single()

      setAthlete(data as Athlete | null)
      setLoading(false)
    }

    fetchAthlete()
  }, [id])

  return { athlete, loading }
}
