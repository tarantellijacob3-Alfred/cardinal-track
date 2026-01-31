import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { MeetEntryInsert, MeetEntryWithDetails } from '../types/database'

export function useMeetEntries(meetId: string | undefined) {
  const [entries, setEntries] = useState<MeetEntryWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!meetId) {
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('meet_entries')
      .select(`
        *,
        athletes (*),
        events (*)
      `)
      .eq('meet_id', meetId)
      .order('created_at')

    if (!error && data) {
      setEntries(data as unknown as MeetEntryWithDetails[])
    }
    setLoading(false)
  }, [meetId])

  useEffect(() => {
    fetch()
  }, [fetch])

  async function addEntry(entry: MeetEntryInsert) {
    const { data, error } = await supabase
      .from('meet_entries')
      .insert(entry as Record<string, unknown>)
      .select(`
        *,
        athletes (*),
        events (*)
      `)
      .single()

    if (!error && data) {
      setEntries(prev => [...prev, data as unknown as MeetEntryWithDetails])
    }
    return { data, error }
  }

  async function removeEntry(entryId: string) {
    const { error } = await supabase
      .from('meet_entries')
      .delete()
      .eq('id', entryId)

    if (!error) {
      setEntries(prev => prev.filter(e => e.id !== entryId))
    }
    return { error }
  }

  async function updateEntry(entryId: string, updates: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('meet_entries')
      .update(updates)
      .eq('id', entryId)
      .select(`
        *,
        athletes (*),
        events (*)
      `)
      .single()

    if (!error && data) {
      setEntries(prev => prev.map(e => e.id === entryId ? data as unknown as MeetEntryWithDetails : e))
    }
    return { data, error }
  }

  function getEntriesByEvent(eventId: string) {
    return entries.filter(e => e.event_id === eventId)
  }

  function getEntriesByAthlete(athleteId: string) {
    return entries.filter(e => e.athlete_id === athleteId)
  }

  function getAthleteEventCount(athleteId: string, excludeRelays: boolean = false) {
    return entries.filter(e => {
      if (e.athlete_id !== athleteId) return false
      if (excludeRelays && e.events?.is_relay) return false
      return true
    }).length
  }

  return {
    entries, loading, refetch: fetch,
    addEntry, removeEntry, updateEntry,
    getEntriesByEvent, getEntriesByAthlete, getAthleteEventCount
  }
}

export function useAthleteEntries(athleteId: string | undefined) {
  const [entries, setEntries] = useState<MeetEntryWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!athleteId) {
      setLoading(false)
      return
    }

    async function fetchEntries() {
      setLoading(true)
      const { data, error } = await supabase
        .from('meet_entries')
        .select(`
          *,
          athletes (*),
          events (*)
        `)
        .eq('athlete_id', athleteId!)

      if (!error && data) {
        setEntries(data as unknown as MeetEntryWithDetails[])
      }
      setLoading(false)
    }

    fetchEntries()
  }, [athleteId])

  return { entries, loading }
}
