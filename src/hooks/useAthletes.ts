import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Athlete, AthleteInsert, AthleteUpdate } from '../types/database'

export function useAthletes() {
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('athletes')
      .select('*')
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true })

    if (!error && data) {
      setAthletes(data as Athlete[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  async function addAthlete(athlete: AthleteInsert) {
    const { data, error } = await supabase
      .from('athletes')
      .insert(athlete as Record<string, unknown>)
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

  return { athletes, loading, refetch: fetch, addAthlete, updateAthlete, deleteAthlete }
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
