import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useTeam } from '../hooks/useTeam'

interface AthleteSeasonStatsProps {
  athleteId: string
}

/**
 * Shows event count & meet count for an athlete in the selected season.
 */
export default function AthleteSeasonStats({ athleteId }: AthleteSeasonStatsProps) {
  const { selectedSeasonId, seasons } = useTeam()
  const [eventCount, setEventCount] = useState<number>(0)
  const [meetCount, setMeetCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  const selectedSeason = seasons.find(s => s.id === selectedSeasonId)

  useEffect(() => {
    if (!selectedSeasonId || !athleteId) {
      setEventCount(0)
      setMeetCount(0)
      setLoading(false)
      return
    }

    async function fetchStats() {
      setLoading(true)

      // Get meets in this season
      const { data: seasonMeets } = await supabase
        .from('meets')
        .select('id')
        .eq('season_id', selectedSeasonId!)

      if (!seasonMeets || seasonMeets.length === 0) {
        setEventCount(0)
        setMeetCount(0)
        setLoading(false)
        return
      }

      const meetIds = seasonMeets.map(m => m.id)

      // Count entries for this athlete in those meets
      const { data: entries } = await supabase
        .from('meet_entries')
        .select('meet_id')
        .eq('athlete_id', athleteId)
        .in('meet_id', meetIds)

      if (entries) {
        setEventCount(entries.length)
        const uniqueMeets = new Set(entries.map(e => e.meet_id))
        setMeetCount(uniqueMeets.size)
      } else {
        setEventCount(0)
        setMeetCount(0)
      }

      setLoading(false)
    }

    fetchStats()
  }, [selectedSeasonId, athleteId])

  if (!selectedSeasonId || loading) return null

  return (
    <div className="flex items-center gap-3 text-xs text-gray-500">
      <span className="bg-navy-50 text-navy-700 px-2 py-0.5 rounded-full font-medium">
        {selectedSeason?.name || 'Season'}
      </span>
      <span>{meetCount} meet{meetCount !== 1 ? 's' : ''}</span>
      <span>·</span>
      <span>{eventCount} event{eventCount !== 1 ? 's' : ''}</span>
    </div>
  )
}
