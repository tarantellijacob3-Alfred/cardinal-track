import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTeam, useTeamPath } from '../hooks/useTeam'
import SearchBar from '../components/SearchBar'
import type { Athlete, Meet, MeetEntryWithDetails } from '../types/database'

export default function PublicSearch() {
  const [search, setSearch] = useState('')
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [meets, setMeets] = useState<Meet[]>([])
  const [allEntries, setAllEntries] = useState<MeetEntryWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null)
  const { team } = useTeam()
  const teamPath = useTeamPath()

  useEffect(() => {
    async function fetchData() {
      if (!team?.id) return
      setLoading(true)

      const [athletesRes, meetsRes, entriesRes] = await Promise.all([
        supabase.from('athletes').select('*').eq('active', true).eq('team_id', team.id).order('last_name'),
        supabase.from('meets').select('*').eq('team_id', team.id).order('date', { ascending: false }),
        supabase.from('meet_entries').select('*, athletes(*), events(*)'),
      ])

      if (athletesRes.data) setAthletes(athletesRes.data)
      if (meetsRes.data) setMeets(meetsRes.data)
      if (entriesRes.data) setAllEntries(entriesRes.data as unknown as MeetEntryWithDetails[])
      setLoading(false)
    }
    fetchData()
  }, [team?.id])

  const filteredAthletes = useMemo(() => {
    if (!search || search.length < 2) return []
    const q = search.toLowerCase()
    return athletes.filter(a =>
      a.first_name.toLowerCase().includes(q) ||
      a.last_name.toLowerCase().includes(q) ||
      `${a.last_name} ${a.first_name}`.toLowerCase().includes(q) ||
      `${a.first_name} ${a.last_name}`.toLowerCase().includes(q)
    ).slice(0, 20)
  }, [athletes, search])

  const athleteEntries = useMemo(() => {
    if (!selectedAthlete) return []
    return allEntries.filter(e => e.athlete_id === selectedAthlete.id)
  }, [selectedAthlete, allEntries])

  // Group by meet
  const entriesByMeet: Record<string, MeetEntryWithDetails[]> = {}
  for (const entry of athleteEntries) {
    if (!entriesByMeet[entry.meet_id]) {
      entriesByMeet[entry.meet_id] = []
    }
    entriesByMeet[entry.meet_id].push(entry)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-800" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-navy-900">Athlete Search</h1>
        <p className="text-gray-500 mt-1">Look up meet assignments for any athlete</p>
      </div>

      <SearchBar
        value={search}
        onChange={(v) => { setSearch(v); setSelectedAthlete(null) }}
        placeholder="Type athlete name..."
      />

      {/* Search results */}
      {search.length >= 2 && !selectedAthlete && (
        <div className="card">
          {filteredAthletes.length === 0 ? (
            <p className="text-center text-gray-400 py-4">No athletes found for &quot;{search}&quot;</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredAthletes.map(athlete => (
                <button
                  key={athlete.id}
                  onClick={() => setSelectedAthlete(athlete)}
                  className="w-full flex items-center justify-between p-3 hover:bg-navy-50 rounded-lg transition-colors min-h-[44px]"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-navy-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-navy-700">
                        {athlete.first_name[0]}{athlete.last_name[0]}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-navy-900">
                        {athlete.last_name}, {athlete.first_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {athlete.level} {athlete.gender}
                        {athlete.grade ? ` · Grade ${athlete.grade}` : ''}
                      </p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selected athlete detail */}
      {selectedAthlete && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-navy-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-navy-700">
                    {selectedAthlete.first_name[0]}{selectedAthlete.last_name[0]}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-navy-900">
                    {selectedAthlete.first_name} {selectedAthlete.last_name}
                  </h2>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className={`badge ${selectedAthlete.level === 'JV' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                      {selectedAthlete.level}
                    </span>
                    <span className="badge bg-gray-100 text-gray-800">{selectedAthlete.gender}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => { setSelectedAthlete(null); setSearch('') }}
                className="p-2 hover:bg-gray-100 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Meet assignments */}
          {Object.keys(entriesByMeet).length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-400">No meet assignments found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(entriesByMeet).map(([meetId, meetEntries]) => {
                const meet = meets.find(m => m.id === meetId)
                if (!meet) return null
                const meetDate = new Date(meet.date + 'T00:00:00')

                return (
                  <div key={meetId} className="card">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-navy-900">{meet.name}</h3>
                        <p className="text-sm text-gray-500">
                          {meetDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          {meet.location && ` — ${meet.location}`}
                        </p>
                      </div>
                      <span className="badge bg-navy-100 text-navy-700">{meetEntries.length} events</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {meetEntries.map(entry => (
                        <span key={entry.id} className={`text-sm px-3 py-1.5 rounded-full font-medium ${
                          entry.events.category === 'Field' ? 'bg-green-100 text-green-800' :
                          entry.events.category === 'Sprint' ? 'bg-blue-100 text-blue-800' :
                          entry.events.category === 'Distance' ? 'bg-purple-100 text-purple-800' :
                          entry.events.category === 'Hurdles' ? 'bg-orange-100 text-orange-800' :
                          entry.events.category === 'Relay' ? 'bg-pink-100 text-pink-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {entry.events.name}
                          {entry.relay_leg ? ` (Leg ${entry.relay_leg})` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Call to action */}
      {!search && (
        <div className="card text-center py-8">
          <div className="w-16 h-16 bg-navy-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-navy-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-gray-600">Search for an athlete to view their meet assignments</p>
          <p className="text-sm text-gray-400 mt-2">
            {athletes.length} athletes in the system
          </p>
        </div>
      )}
    </div>
  )
}
