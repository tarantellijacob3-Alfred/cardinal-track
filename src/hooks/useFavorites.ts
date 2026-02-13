import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Favorite } from '../types/database'

export function useFavorites() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) {
      setFavorites([])
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setFavorites(data as Favorite[])
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetch()
  }, [fetch])

  const isFavorite = useCallback(
    (athleteId: string) => favorites.some(f => f.athlete_id === athleteId),
    [favorites]
  )

  async function addFavorite(athleteId: string) {
    if (!user) return { error: new Error('Not authenticated') }

    const { data, error } = await supabase
      .from('favorites')
      .insert({ profile_id: user.id, athlete_id: athleteId } as Record<string, unknown>)
      .select()
      .single()

    if (!error && data) {
      setFavorites(prev => [data as Favorite, ...prev])
    }
    return { error }
  }

  async function removeFavorite(athleteId: string) {
    if (!user) return { error: new Error('Not authenticated') }

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('profile_id', user.id)
      .eq('athlete_id', athleteId)

    if (!error) {
      setFavorites(prev => prev.filter(f => f.athlete_id !== athleteId))
    }
    return { error }
  }

  async function toggleFavorite(athleteId: string) {
    if (isFavorite(athleteId)) {
      return removeFavorite(athleteId)
    } else {
      return addFavorite(athleteId)
    }
  }

  return {
    favorites,
    loading,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    refetch: fetch,
  }
}
