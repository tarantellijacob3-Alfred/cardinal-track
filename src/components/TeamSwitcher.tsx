import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTeam } from '../hooks/useTeam'
import type { Team } from '../types/database'

interface TeamSwitcherProps {
  /** Which auth sub-path to navigate to, e.g. '/login', '/register', '/parent-signup' */
  authPath: string
}

export default function TeamSwitcher({ authPath }: TeamSwitcherProps) {
  const { team, teamSlug } = useTeam()
  const navigate = useNavigate()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState(0)

  useEffect(() => {
    async function fetchTeams() {
      const { data } = await supabase
        .from('teams')
        .select('*')
        .eq('active', true)
        .order('name')
      if (data) setTeams(data as Team[])
      setLoading(false)
    }
    fetchTeams()
  }, [])

  // Measure content height for smooth animation
  useEffect(() => {
    if (open && contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight)
    }
  }, [open, search, teams])

  const otherTeams = teams.filter(t => t.slug !== teamSlug)
  const filteredTeams = search.trim()
    ? otherTeams.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        (t.school_name && t.school_name.toLowerCase().includes(search.toLowerCase()))
      )
    : otherTeams

  if (loading || otherTeams.length === 0) return null

  return (
    <div className="text-center mb-4">
      <button
        onClick={() => { setOpen(!open); if (open) setSearch('') }}
        className="text-sm text-navy-600 hover:text-navy-800 transition-colors inline-flex items-center gap-1"
      >
        Switch teams
        <svg
          className={`w-4 h-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        style={{ maxHeight: open ? contentHeight + 32 : 0 }}
        className="overflow-hidden transition-all duration-300 ease-in-out"
      >
        <div ref={contentRef} className="pt-3">
          <div className={`bg-white border border-gray-200 rounded-xl shadow-sm p-4 max-w-md mx-auto transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}>
            {otherTeams.length > 3 && (
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Search teams..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                  autoFocus={open}
                />
              </div>
            )}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {/* Current team (highlighted) */}
              {team && (
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-navy-50 border border-navy-200">
                  {team.logo_url ? (
                    <img src={team.logo_url} alt={team.name} className="w-8 h-8 object-contain rounded-full" />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: team.primary_color || '#1e3a5f' }}
                    >
                      <span className="text-white font-bold text-xs">
                        {team.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="text-left">
                    <span className="text-sm font-medium text-navy-900">{team.name}</span>
                    <span className="text-xs text-navy-600 ml-2">(current)</span>
                  </div>
                </div>
              )}

              {/* Other teams */}
              {filteredTeams.length === 0 && search.trim() && (
                <p className="text-sm text-gray-400 text-center py-2">No teams found</p>
              )}
              {filteredTeams.map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    navigate(`/t/${t.slug}${authPath}`)
                    setOpen(false)
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors w-full text-left"
                >
                  {t.logo_url ? (
                    <img src={t.logo_url} alt={t.name} className="w-8 h-8 object-contain rounded-full" />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: t.primary_color || '#1e3a5f' }}
                    >
                      <span className="text-white font-bold text-xs">
                        {t.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-gray-800">{t.name}</span>
                    {t.school_name && (
                      <p className="text-xs text-gray-500">{t.school_name}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
