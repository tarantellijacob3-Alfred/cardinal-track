import { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { Team } from '../types/database'

export default function Landing() {
  const { user, profile } = useAuth()
  const [searchParams] = useSearchParams()
  const [teams, setTeams] = useState<Team[]>([])
  const [teamsLoading, setTeamsLoading] = useState(true)
  const [search, setSearch] = useState('')

  const message = searchParams.get('message')

  useEffect(() => {
    async function fetchTeams() {
      const { data } = await supabase
        .from('teams')
        .select('*')
        .eq('active', true)
        .order('name')
      if (data) setTeams(data as Team[])
      setTeamsLoading(false)
    }
    fetchTeams()
  }, [])

  const filteredTeams = useMemo(() => {
    if (!search.trim()) return teams
    const q = search.toLowerCase()
    return teams.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.school_name.toLowerCase().includes(q) ||
      t.slug.toLowerCase().includes(q)
    )
  }, [teams, search])

  // Resolve team slug from profile for logged-in users
  const userTeamSlug = useMemo(() => {
    if (!profile?.team_id || !teams.length) return null
    const t = teams.find(t => t.id === profile.team_id)
    return t?.slug || null
  }, [profile, teams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      {/* Nav */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">TR</span>
          </div>
          <span className="text-white font-bold text-xl">TrackRoster</span>
        </div>
        <div className="flex items-center space-x-4">
          {user ? (
            <Link
              to={userTeamSlug ? `/t/${userTeamSlug}` : '#directory'}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-400 transition-colors"
            >
              {userTeamSlug ? 'My Dashboard' : 'Find Your Team'}
            </Link>
          ) : (
            <>
              <Link
                to="/onboard"
                className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-400 transition-colors"
              >
                Start Your Team
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Flash message */}
      {message && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-blue-900/60 border border-blue-700 rounded-lg p-3 text-blue-200 text-sm text-center">
            {message}
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
        <h1 className="text-4xl sm:text-6xl font-bold text-white leading-tight">
          Your Track Team,
          <span className="block text-blue-400 mt-2">Organized</span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
          The all-in-one platform for high school track &amp; field teams.
          Manage rosters, assign meet entries, export Hy-Tek files, and keep parents in the loop.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/onboard"
            className="bg-blue-500 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-blue-400 transition-colors"
          >
            Start Your Team — Free
          </Link>
          <a
            href="#directory"
            className="bg-gray-700 text-white px-8 py-3 rounded-lg font-medium text-lg hover:bg-gray-600 transition-colors"
          >
            Find Your Team
          </a>
        </div>
        <p className="mt-4 text-gray-400 text-sm">
          Parent or athlete?{' '}
          <a href="#directory" className="text-blue-400 hover:text-blue-300 font-medium">
            Find your team below
          </a>{' '}
          and sign up from their page.
        </p>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'Roster Management', desc: 'Track athletes by grade, level, and gender. Bulk import from CSV.', icon: '👥' },
            { title: 'Meet Entries', desc: 'Assign athletes to events with 4-event limit enforcement.', icon: '🏃' },
            { title: 'Hy-Tek Export', desc: 'Generate industry-standard entry files for meet management software.', icon: '📄' },
            { title: 'Parent Access', desc: 'Parents can favorite athletes and track upcoming meets and results.', icon: '⭐' },
            { title: 'Public Search', desc: 'Anyone can look up athlete assignments — no account needed.', icon: '🔍' },
            { title: 'Mobile Ready', desc: 'Works great on phones, tablets, and desktops.', icon: '📱' },
          ].map((feature) => (
            <div key={feature.title} className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <span className="text-3xl">{feature.icon}</span>
              <h3 className="text-white font-semibold text-lg mt-3">{feature.title}</h3>
              <p className="text-gray-400 mt-2 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Team Directory */}
      <div id="directory" className="bg-gray-900/80 border-t border-gray-700 scroll-mt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white">Find Your Team</h2>
            <p className="text-gray-400 mt-2">
              Browse active teams on TrackRoster or search by name.
            </p>
          </div>

          {/* Search */}
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search teams..."
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Team Cards */}
          {teamsLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">
                {search ? `No teams found for "${search}"` : 'No teams on TrackRoster yet.'}
              </p>
              <Link
                to="/onboard"
                className="inline-block mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-400 transition-colors"
              >
                Be the first — Start Your Team
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTeams.map(team => (
                <Link
                  key={team.id}
                  to={`/t/${team.slug}`}
                  className="group bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-blue-500 hover:bg-gray-750 transition-all duration-200"
                >
                  <div className="flex items-center space-x-4">
                    {/* Team color swatch */}
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${team.primary_color || '#3B82F6'}, ${team.secondary_color || '#1E40AF'})`,
                      }}
                    >
                      {team.logo_url ? (
                        <img src={team.logo_url} alt={team.name} className="w-10 h-10 object-contain rounded-lg bg-white/90 p-0.5" />
                      ) : (
                        <span className="text-white font-bold text-lg">
                          {team.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-white font-semibold text-lg group-hover:text-blue-400 transition-colors truncate">
                        {team.name}
                      </h3>
                      <p className="text-gray-400 text-sm truncate">{team.school_name}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm text-gray-500 group-hover:text-blue-400 transition-colors">
                    <span>View team →</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">Ready to get started?</h2>
        <p className="text-gray-400 mt-2 max-w-lg mx-auto">
          Set up your team in minutes. Manage rosters, assign meet entries, and keep everyone in sync.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/onboard"
            className="bg-blue-500 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-blue-400 transition-colors"
          >
            Start Your Team
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-700 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          <p>TrackRoster &mdash; Track &amp; Field Team Management Platform</p>
          <p className="mt-1">© {new Date().getFullYear()} TrackRoster</p>
        </div>
      </footer>
    </div>
  )
}
