import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Meet, MeetInsert, MeetUpdate } from '../types/database'
import { useTeam } from './useTeam'

export function useMeets(seasonFilter?: string | null) {
  const [meets, setMeets] = useState<Meet[]>([])
  const [loading, setLoading] = useState(true)
  const { teamId } = useTeam()

  const fetch = useCallback(async () => {
    if (!teamId) {
      setMeets([])
      setLoading(false)
      return
    }

    setLoading(true)
    let query = supabase
      .from('meets')
      .select('*')
      .eq('team_id', teamId)
      .order('date', { ascending: false })

    // If seasonFilter is provided (non-empty string), filter by it
    if (seasonFilter) {
      query = query.eq('season_id', seasonFilter)
    }

    const { data, error } = await query

    if (!error && data) {
      setMeets(data as Meet[])
    }
    setLoading(false)
  }, [teamId, seasonFilter])

  useEffect(() => {
    fetch()
  }, [fetch])

  async function addMeet(meet: Omit<MeetInsert, 'team_id'>) {
    if (!teamId) return { data: null, error: new Error('No team context') }

    const { data, error } = await supabase
      .from('meets')
      .insert({ ...meet, team_id: teamId } as Record<string, unknown>)
      .select()
      .single()

    if (!error && data) {
      const newMeet = data as Meet
      setMeets(prev => [newMeet, ...prev].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ))
    }
    return { data: data as Meet | null, error }
  }

  async function updateMeet(id: string, updates: MeetUpdate) {
    const { data, error } = await supabase
      .from('meets')
      .update(updates as Record<string, unknown>)
      .eq('id', id)
      .select()
      .single()

    if (!error && data) {
      const updated = data as Meet
      setMeets(prev => prev.map(m => m.id === id ? updated : m))
    }
    return { data: data as Meet | null, error }
  }

  async function deleteMeet(id: string) {
    const { error, count } = await supabase
      .from('meets')
      .delete({ count: 'exact' })
      .eq('id', id)

    if (error) {
      console.error('Failed to delete meet:', error)
      return { error }
    }

    if (count === 0) {
      console.warn('Delete meet: 0 rows affected (RLS block?), id:', id)
    }

    setMeets(prev => prev.filter(m => m.id !== id))
    await fetch()
    return { error }
  }

  return { meets, loading, refetch: fetch, addMeet, updateMeet, deleteMeet }
}

export function useMeet(id: string | undefined) {
  const [meet, setMeet] = useState<Meet | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    async function fetchMeet() {
      setLoading(true)
      const { data } = await supabase
        .from('meets')
        .select('*')
        .eq('id', id!)
        .single()

      setMeet(data as Meet | null)
      setLoading(false)
    }

    fetchMeet()
  }, [id])

  return { meet, loading }
}
