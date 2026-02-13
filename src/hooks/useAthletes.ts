import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Athlete, AthleteInsert, AthleteUpdate } from '../types/database'
import { useTeam } from './useTeam'

export function useAthletes() {
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [loading, setLoading] = useState(true)
  const { teamId } = useTeam()

  const fetch = useCallback(async () => {
    if (!teamId) {
      setAthletes([])
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('athletes')
      .select('*')
      .eq('team_id', teamId)
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true })

    if (!error && data) {
      setAthletes(data as Athlete[])
    }
    setLoading(false)
  }, [teamId])

  useEffect(() => {
    fetch()
  }, [fetch])

  async function addAthlete(athlete: Omit<AthleteInsert, 'team_id'>) {
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
    const { error } = await supabase
      .from('athletes')
      .delete()
      .eq('id', id)

    if (!error) {
      setAthletes(prev => prev.filter(a => a.id !== id))
    }
    return { error }
  }

  async function bulkAddAthletes(newAthletes: Omit<AthleteInsert, 'team_id'>[]) {
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
