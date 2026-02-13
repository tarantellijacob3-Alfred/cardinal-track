import { useState, useEffect } from 'react'
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

  const otherTeams = teams.filter(t => t.slug !== teamSlug)

  if (loading || otherTeams.length === 0) return null

  return (
    <div className="text-center mb-4">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-sm text-navy-600 hover:text-navy-800 hover:underline transition-colors"
        >
          Not your team? Switch teams →
        </button>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 max-w-md mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Switch Team</h3>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-600 text-xs"
            >
              ✕
            </button>
          </div>
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
            {otherTeams.map(t => (
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
      )}
    </div>
  )
}
