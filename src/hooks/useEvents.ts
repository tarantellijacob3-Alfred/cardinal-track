import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { TrackEvent } from '../types/database'

const CATEGORY_ORDER = ['Field', 'Sprint', 'Distance', 'Hurdles', 'Relay', 'Other']

export function useEvents() {
  const [events, setEvents] = useState<TrackEvent[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('name')

    if (!error && data) {
      const typed = data as TrackEvent[]
      const sorted = typed.sort((a, b) => {
        const catA = CATEGORY_ORDER.indexOf(a.category)
        const catB = CATEGORY_ORDER.indexOf(b.category)
        if (catA !== catB) return catA - catB
        return a.name.localeCompare(b.name)
      })
      setEvents(sorted)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  function getEventsByCategory() {
    const grouped: Record<string, TrackEvent[]> = {}
    for (const evt of events) {
      if (!grouped[evt.category]) {
        grouped[evt.category] = []
      }
      grouped[evt.category].push(evt)
    }
    return grouped
  }

  return { events, loading, refetch: fetch, getEventsByCategory }
}
