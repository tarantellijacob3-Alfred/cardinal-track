import { useParams, Link } from 'react-router-dom'
import { useAthlete } from '../hooks/useAthletes'
import { useAthleteEntries } from '../hooks/useMeetEntries'
import { supabase } from '../lib/supabase'
import { useState, useEffect } from 'react'
import type { Meet } from '../types/database'

export default function AthleteDetail() {
  const { id } = useParams<{ id: string }>()
  const { athlete, loading: athleteLoading } = useAthlete(id)
  const { entries, loading: entriesLoading } = useAthleteEntries(id)
  const [meets, setMeets] = useState<Meet[]>([])

  useEffect(() => {
    async function fetchMeets() {
      const { data } = await supabase.from('meets').select('*').order('date', { ascending: false })
      if (data) setMeets(data)
    }
    fetchMeets()
  }, [])

  const loading = athleteLoading || entriesLoading

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-800" />
      </div>
    )
  }

  if (!athlete) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-navy-900">Athlete not found</h2>
        <Link to="/roster" className="btn-primary inline-block mt-4">Back to Roster</Link>
      </div>
    )
  }

  // Group entries by meet
  const entriesByMeet: Record<string, typeof entries> = {}
  for (const entry of entries) {
    if (!entriesByMeet[entry.meet_id]) {
      entriesByMeet[entry.meet_id] = []
    }
    entriesByMeet[entry.meet_id].push(entry)
  }

  return (
    <div className="space-y-6">
      <Link to="/roster" className="text-sm text-navy-600 hover:text-navy-800 font-medium mb-2 inline-block">
        ← Back to Roster
      </Link>

      {/* Athlete header */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-navy-100 rounded-full flex items-center justify-center">
            <span className="text-xl font-bold text-navy-700">
              {athlete.first_name[0]}{athlete.last_name[0]}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy-900">
              {athlete.first_name} {athlete.last_name}
            </h1>
            <div className="flex items-center space-x-3 mt-1">
              <span className={`badge ${athlete.level === 'JV' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                {athlete.level}
              </span>
              <span className="badge bg-gray-100 text-gray-800">{athlete.gender}</span>
              {athlete.grade && (
                <span className="text-sm text-gray-500">Grade {athlete.grade}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-navy-800">{Object.keys(entriesByMeet).length}</p>
          <p className="text-sm text-gray-500">Meets</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-navy-800">{entries.length}</p>
          <p className="text-sm text-gray-500">Total Entries</p>
        </div>
      </div>

      {/* Meet assignments */}
      <div>
        <h2 className="text-lg font-semibold text-navy-900 mb-3">Meet Assignments</h2>
        {Object.keys(entriesByMeet).length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-gray-400">No meet assignments yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(entriesByMeet).map(([meetId, meetEntries]) => {
              const meet = meets.find(m => m.id === meetId)
              if (!meet) return null
              const meetDate = new Date(meet.date + 'T00:00:00')

              return (
                <Link key={meetId} to={`/meets/${meetId}`} className="card block hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-navy-900">{meet.name}</h3>
                      <p className="text-sm text-gray-500">
                        {meetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {meet.location && ` — ${meet.location}`}
                      </p>
                    </div>
                    <span className="badge bg-navy-100 text-navy-700">{meetEntries.length} events</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {meetEntries.map(entry => (
                      <span key={entry.id} className={`text-sm px-3 py-1 rounded-full font-medium ${
                        entry.events.category === 'Field' ? 'bg-green-100 text-green-800' :
                        entry.events.category === 'Sprint' ? 'bg-blue-100 text-blue-800' :
                        entry.events.category === 'Distance' ? 'bg-purple-100 text-purple-800' :
                        entry.events.category === 'Hurdles' ? 'bg-orange-100 text-orange-800' :
                        entry.events.category === 'Relay' ? 'bg-pink-100 text-pink-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {entry.events.short_name}
                        {entry.relay_leg ? ` (L${entry.relay_leg})` : ''}
                      </span>
                    ))}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
