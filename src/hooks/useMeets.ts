import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Meet, MeetInsert, MeetUpdate } from '../types/database'

export function useMeets() {
  const [meets, setMeets] = useState<Meet[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('meets')
      .select('*')
      .order('date', { ascending: false })

    if (!error && data) {
      setMeets(data as Meet[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  async function addMeet(meet: MeetInsert) {
    const { data, error } = await supabase
      .from('meets')
      .insert(meet as Record<string, unknown>)
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
    const { error } = await supabase
      .from('meets')
      .delete()
      .eq('id', id)

    if (!error) {
      setMeets(prev => prev.filter(m => m.id !== id))
    }
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
