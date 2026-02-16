import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
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
  const [athleteCount, setAthleteCount] = useState<number | null>(null)

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

  useEffect(() => {
    async function fetchAthleteCount() {
      const { count } = await supabase
        .from('athletes')
        .select('*', { count: 'exact', head: true })
        .eq('active', true)
      if (count !== null) setAthleteCount(count)
    }
    fetchAthleteCount()
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

  const userTeamSlug = useMemo(() => {
    if (!profile?.team_id || !teams.length) return null
    const t = teams.find(t => t.id === profile.team_id)
    return t?.slug || null
  }, [profile, teams])

  return (
    <div className="min-h-screen bg-white">
      {/* ═══ Navbar ═══ */}
      <nav className="bg-navy-950 border-b border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img src="/trackroster-logo.svg" alt="TrackRoster" className="w-9 h-9" />
            <span className="text-white font-bold text-xl tracking-tight">TrackRoster</span>
          </div>
          <div className="flex items-center space-x-3">
            {user ? (
              <Link
                to={userTeamSlug ? `/t/${userTeamSlug}` : '#directory'}
                className="bg-brand-500 text-white px-5 py-2 rounded-lg font-semibold text-sm hover:bg-brand-600 transition-colors"
              >
                {userTeamSlug ? 'My Dashboard' : 'Find Your Team'}
              </Link>
            ) : (
              <>
                <a
                  href="#directory"
                  className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors hidden sm:block"
                >
                  Find Your Team
                </a>
                <Link
                  to="/onboard"
                  className="bg-brand-500 text-white px-5 py-2 rounded-lg font-semibold text-sm hover:bg-brand-600 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Flash message */}
      {message && (
        <div className="bg-brand-600 text-white text-center text-sm py-2 px-4">
          {message}
        </div>
      )}

      {/* ═══ Hero ═══ */}
      <div className="bg-gradient-to-b from-navy-950 via-navy-900 to-navy-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
            Your track team's{' '}
            <span className="text-brand-400">home base.</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Manage rosters, assign meet entries, and keep coaches, athletes, and parents all on the same page.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center max-w-md sm:max-w-none mx-auto">
            <Link
              to="/onboard"
              className="bg-brand-500 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-brand-600 transition-colors shadow-lg shadow-black/20"
            >
              GET STARTED
            </Link>
            <a
              href="#directory"
              className="border-2 border-white/30 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/10 transition-colors"
            >
              FIND YOUR TEAM →
            </a>
          </div>
          <p className="mt-5 text-gray-400 text-sm">
            Free 14-day trial · No credit card required
          </p>
        </div>
      </div>

      {/* ═══ Social Proof Strip ═══ */}
      <div className="bg-white border-b border-gray-100 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-medium text-gray-400 uppercase tracking-wider mb-6">
            Trusted by coaches and teams
          </p>
          <div className="flex items-center justify-center gap-8 sm:gap-16 flex-wrap">
            {/* Stats instead of logos (more impressive when early-stage) */}
            <div className="text-center">
              <p className="text-3xl font-bold text-navy-900">{teams.length}+</p>
              <p className="text-sm text-gray-500 mt-1">Active Teams</p>
            </div>
            <div className="w-px h-10 bg-gray-200 hidden sm:block" />
            <div className="text-center">
              <p className="text-3xl font-bold text-navy-900">{athleteCount ?? '—'}+</p>
              <p className="text-sm text-gray-500 mt-1">Athletes Managed</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Features Carousel ═══ */}
      <FeaturesCarousel />

      {/* ═══ CTA Banner ═══ */}
      <div className="bg-gradient-to-r from-navy-900 to-navy-800 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
            Ready to ditch the spreadsheets?
          </h2>
          <p className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto">
            Set up your team in under 5 minutes. Import your roster, create your first meet, and invite parents — all before your next practice.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/onboard"
              className="bg-brand-500 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-brand-600 transition-colors shadow-lg"
            >
              Start Your Team — Free
            </Link>
          </div>
          <p className="mt-4 text-gray-400 text-sm">
            $300/season after 14-day free trial · Cancel anytime
          </p>
        </div>
      </div>

      {/* ═══ Team Directory ═══ */}
      <div id="directory" className="bg-gray-50 scroll-mt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-navy-900">Find Your Team</h2>
            <p className="text-gray-500 mt-2">
              Parent or athlete? Find your team below and sign up from their page.
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
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-navy-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent shadow-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy-900"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Team Cards */}
          {teamsLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-800" />
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {search ? `No teams found for "${search}"` : 'No teams on TrackRoster yet.'}
              </p>
              <Link
                to="/onboard"
                className="inline-block mt-4 bg-navy-900 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-navy-800 transition-colors"
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
                  className="group bg-white border border-gray-200 rounded-xl p-6 hover:border-brand-400 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-center space-x-4">
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
                      <h3 className="text-navy-900 font-semibold text-lg group-hover:text-brand-600 transition-colors truncate">
                        {team.name}
                      </h3>
                      <p className="text-gray-500 text-sm truncate">{team.school_name}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm text-gray-400 group-hover:text-brand-600 transition-colors">
                    <span>View team →</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══ Footer ═══ */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-400">
          <p className="font-medium text-gray-500">TrackRoster</p>
          <p className="mt-1">Track &amp; Field Team Management</p>
          <p className="mt-1">© {new Date().getFullYear()} TrackRoster. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

/* ═══════════════════════════════════════════
   Animated Features Carousel
   ═══════════════════════════════════════════ */

const FEATURE_LABELS = [
  { label: 'Manage rosters', color: 'bg-brand-100 text-brand-700' },
  { label: 'Assign meet entries', color: 'bg-green-100 text-green-700' },
  { label: 'Track parent favorites', color: 'bg-brand-100 text-brand-700' },
  { label: 'TFRRS integration', color: 'bg-purple-100 text-purple-700' },
]

/* ── Animated Roster Mockup ── */
function RosterMockup() {
  const [step, setStep] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const athletes = [
    { name: 'Sarah Johnson', grade: 11, level: 'Varsity' as const, gender: 'Girls' },
    { name: 'Marcus Williams', grade: 10, level: 'JV' as const, gender: 'Boys' },
    { name: 'Emma Rodriguez', grade: 12, level: 'Varsity' as const, gender: 'Girls' },
  ]
  const newAthlete = { name: 'Jake Thompson', grade: 9, level: 'JV' as const, gender: 'Boys' }

  useEffect(() => {
    const sequence = [1500, 1200, 1500, 1200, 2000]
    let i = 0
    function tick() {
      timerRef.current = setTimeout(() => {
        setStep(s => (s + 1) % 5)
        i = (i + 1) % sequence.length
        tick()
      }, sequence[i])
    }
    tick()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  // step 0: base roster, step 1: add form appears, step 2: new athlete slides in, step 3: promote Marcus to Varsity, step 4: reset
  const showForm = step === 1
  const showNew = step >= 2
  const promoted = step >= 3
  const count = showNew ? 4 : 3

  return (
    <div className="bg-gray-50 rounded-xl p-4 shadow-inner">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-navy-900 text-sm">Roster</h3>
        <span className="text-xs bg-brand-100 text-brand-700 px-2 py-1 rounded-full transition-all duration-300">
          {count} athletes
        </span>
      </div>

      {/* Add athlete form */}
      <div className={`overflow-hidden transition-all duration-500 ${showForm ? 'max-h-12 opacity-100 mb-2' : 'max-h-0 opacity-0'}`}>
        <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-lg px-3 py-2">
          <span className="text-xs text-brand-700">+ Adding:</span>
          <span className="text-xs font-semibold text-brand-900">Jake Thompson</span>
          <span className="ml-auto text-xs bg-brand-500 text-white px-2 py-0.5 rounded">Save</span>
        </div>
      </div>

      {athletes.map((a, i) => (
        <div key={i} className={`flex items-center justify-between py-2 ${i > 0 ? 'border-t border-gray-200' : ''}`}>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-navy-100 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-navy-700">{a.name.split(' ').map(w => w[0]).join('')}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-navy-900">{a.name}</p>
              <p className="text-xs text-gray-500">Grade {a.grade} · {a.gender}</p>
            </div>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium transition-all duration-500 ${
            i === 1 && promoted
              ? 'bg-purple-100 text-purple-700'
              : a.level === 'Varsity' ? 'bg-purple-100 text-purple-700' : 'bg-brand-100 text-brand-700'
          }`}>
            {i === 1 && promoted ? 'Varsity' : a.level}
          </span>
        </div>
      ))}

      {/* New athlete slides in */}
      <div className={`overflow-hidden transition-all duration-700 ${showNew ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="flex items-center justify-between py-2 border-t border-gray-200 bg-green-50/50 -mx-4 px-4 rounded-b-xl">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-green-700">JT</span>
            </div>
            <div>
              <p className="text-sm font-medium text-navy-900">{newAthlete.name}</p>
              <p className="text-xs text-gray-500">Grade {newAthlete.grade} · {newAthlete.gender}</p>
            </div>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-brand-100 text-brand-700">JV</span>
        </div>
      </div>
    </div>
  )
}

/* ── Animated Meet Entries Mockup ── */
function MeetEntriesMockup() {
  const [activeTab, setActiveTab] = useState(0)
  const [step, setStep] = useState(0)

  const events = [
    { name: '100m', category: 'sprint' },
    { name: 'Pole Vault', category: 'field' },
    { name: '4x400', category: 'relay' },
  ]

  const eventData: Record<number, { assigned: string[]; available: string[] }> = {
    0: { assigned: ['Johnson, S.', 'Williams, M.'], available: ['Chen, A.', 'Davis, K.', 'Rodriguez, E.'] },
    1: { assigned: ['Thompson, J.'], available: ['Rodriguez, E.', 'Chen, A.'] },
    2: { assigned: ['Johnson, S.', 'Williams, M.', 'Chen, A.'], available: ['Davis, K.', 'Thompson, J.'] },
  }

  // Animation: step 0 = idle, step 1 = highlight available athlete, step 2 = move to assigned, step 3 = pause, step 4 = reset
  useEffect(() => {
    const sequence = [2000, 800, 800, 2000, 500]
    let i = 0
    let timer: ReturnType<typeof setTimeout> | null = null
    function tick() {
      timer = setTimeout(() => {
        setStep(s => {
          if (s === 4) {
            setActiveTab(t => (t + 1) % 3)
            return 0
          }
          return s + 1
        })
        i = (i + 1) % sequence.length
        tick()
      }, sequence[i])
    }
    tick()
    return () => { if (timer) clearTimeout(timer) }
  }, [])

  const data = eventData[activeTab]
  const movingAthlete = data.available[0]
  const isHighlighted = step >= 1 && step < 4
  const isMoved = step >= 2 && step < 4

  const categoryColors: Record<string, string> = {
    sprint: 'bg-blue-500 text-white',
    field: 'bg-green-500 text-white',
    relay: 'bg-purple-500 text-white',
  }
  const categoryInactive: Record<string, string> = {
    sprint: 'bg-blue-100 text-blue-700',
    field: 'bg-green-100 text-green-700',
    relay: 'bg-purple-100 text-purple-700',
  }

  return (
    <div className="bg-gray-50 rounded-xl p-4 shadow-inner">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-navy-900 text-sm">District Championship</h3>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Feb 22</span>
      </div>

      {/* Event tabs */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto">
        {events.map((e, i) => (
          <button
            key={i}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              i === activeTab ? categoryColors[e.category] : categoryInactive[e.category]
            }`}
          >
            <div>{e.name}</div>
            <div className="text-[10px] opacity-75">
              {i === activeTab
                ? `${(isMoved ? data.assigned.length + 1 : data.assigned.length)} entered`
                : `${eventData[i].assigned.length} entered`
              }
            </div>
          </button>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-2 gap-2">
        {/* Assigned */}
        <div>
          <p className="text-[10px] font-semibold text-navy-700 uppercase tracking-wider mb-1.5">
            {events[activeTab].name} ({isMoved ? data.assigned.length + 1 : data.assigned.length})
          </p>
          <div className="space-y-1">
            {data.assigned.map((a, i) => (
              <div key={i} className="flex items-center gap-1.5 py-1 px-2 bg-white rounded-md text-xs">
                <span className="text-gray-400 text-[10px] w-3">{i + 1}.</span>
                <span className="font-medium text-navy-800">{a}</span>
              </div>
            ))}
            {/* Animated new entry */}
            <div className={`flex items-center gap-1.5 py-1 px-2 rounded-md text-xs transition-all duration-500 ${
              isMoved ? 'bg-green-50 opacity-100 max-h-8 border border-green-200' : 'opacity-0 max-h-0 overflow-hidden'
            }`}>
              <span className="text-gray-400 text-[10px] w-3">{data.assigned.length + 1}.</span>
              <span className="font-medium text-green-700">{movingAthlete}</span>
            </div>
          </div>
        </div>

        {/* Available */}
        <div>
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Available</p>
          <div className="space-y-1">
            {data.available.map((a, i) => {
              const isTarget = i === 0
              return (
                <div
                  key={i}
                  className={`flex items-center gap-1.5 py-1 px-2 rounded-md text-xs transition-all duration-300 ${
                    isTarget && isMoved
                      ? 'opacity-0 max-h-0 overflow-hidden'
                      : isTarget && isHighlighted
                        ? 'bg-brand-50 border border-brand-300 ring-1 ring-brand-200'
                        : 'bg-white'
                  }`}
                >
                  <span className={`font-medium ${isTarget && isHighlighted ? 'text-brand-700' : 'text-navy-700'}`}>{a}</span>
                  <svg className={`w-3 h-3 ml-auto transition-all duration-300 ${
                    isTarget && isHighlighted ? 'text-brand-500 opacity-100' : 'text-gray-300 opacity-0'
                  }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Animated Parent Favorites Mockup ── */
function ParentFavesMockup() {
  const [starred, setStarred] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setStarred(true), 1500)
    const t2 = setTimeout(() => setShowDetails(true), 2500)
    const t3 = setTimeout(() => { setStarred(false); setShowDetails(false) }, 6000)
    const t4 = setTimeout(() => setStarred(true), 7500)
    const t5 = setTimeout(() => setShowDetails(true), 8500)
    // Loop
    const loop = setInterval(() => {
      setStarred(false); setShowDetails(false)
      setTimeout(() => setStarred(true), 1500)
      setTimeout(() => setShowDetails(true), 2500)
    }, 8000)

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); clearInterval(loop) }
  }, [])

  return (
    <div className="bg-gray-50 rounded-xl p-4 shadow-inner">
      <div className="mb-3">
        <h3 className="font-bold text-navy-900 text-sm">Athlete Search</h3>
      </div>

      {/* Search bar mockup */}
      <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 mb-3 flex items-center">
        <svg className="h-3 w-3 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <span className="text-xs text-navy-900">Jake Thompson</span>
        <span className="animate-pulse text-navy-900 text-xs">|</span>
      </div>

      {/* Result card */}
      <div className="bg-white rounded-lg p-3 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-navy-100 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-navy-700">JT</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-navy-900">Jake Thompson</p>
              <p className="text-xs text-gray-500">Grade 9 · JV · Boys</p>
            </div>
          </div>
          {/* Star button */}
          <button className={`transition-all duration-500 ${starred ? 'scale-125' : 'scale-100'}`}>
            <svg className={`w-5 h-5 ${starred ? 'text-brand-500 fill-brand-500' : 'text-gray-300'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} fill={starred ? 'currentColor' : 'none'}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
          </button>
        </div>

        {/* Expand with meet details */}
        <div className={`overflow-hidden transition-all duration-700 ${showDetails ? 'max-h-24 opacity-100 mt-2 pt-2 border-t border-gray-100' : 'max-h-0 opacity-0'}`}>
          <p className="text-xs text-gray-500 mb-1.5">Now on your dashboard</p>
          <div className="bg-gray-50 rounded-lg p-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-navy-800">District Championship</p>
              <p className="text-xs text-gray-400">Feb 22</p>
            </div>
            <div className="flex gap-1 mt-1">
              <span className="text-xs bg-navy-100 text-navy-700 px-1.5 py-0.5 rounded-full">Pole Vault</span>
              <span className="text-xs bg-navy-100 text-navy-700 px-1.5 py-0.5 rounded-full">High Jump</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Animated TFRRS Integration Mockup ── */
function TFRRSMockup() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const sequence = [2000, 1500, 1500, 1500, 2500]
    let i = 0
    const timerRef = { current: null as ReturnType<typeof setTimeout> | null }
    function tick() {
      timerRef.current = setTimeout(() => {
        setStep(s => (s + 1) % 5)
        i = (i + 1) % sequence.length
        tick()
      }, sequence[i])
    }
    tick()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  // step 0: athlete profile, step 1: link TFRRS URL, step 2: results load in, step 3: PRs highlight, step 4: reset
  const linked = step >= 1
  const resultsLoaded = step >= 2
  const prsShown = step >= 3

  return (
    <div className="bg-gray-50 rounded-xl p-4 shadow-inner">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-navy-900 text-sm">Athlete Profile</h3>
        <span className={`text-xs px-2 py-1 rounded-full transition-all duration-500 ${
          linked ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-400'
        }`}>
          {linked ? '✓ TFRRS Linked' : 'No TFRRS'}
        </span>
      </div>

      {/* Athlete header */}
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-10 h-10 bg-navy-100 rounded-full flex items-center justify-center">
          <span className="text-xs font-bold text-navy-700">SJ</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-navy-900">Sarah Johnson</p>
          <p className="text-xs text-gray-500">Grade 11 · Varsity · Girls</p>
        </div>
      </div>

      {/* Link TFRRS animation */}
      <div className={`overflow-hidden transition-all duration-500 ${
        step === 1 && !resultsLoaded ? 'max-h-10 opacity-100 mb-2' : 'max-h-0 opacity-0'
      }`}>
        <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
          <span className="text-xs text-purple-700 truncate">tfrrs.org/athletes/7438291</span>
          <span className="ml-auto text-xs bg-purple-500 text-white px-2 py-0.5 rounded whitespace-nowrap">Link</span>
        </div>
      </div>

      {/* Results pulled from TFRRS */}
      <div className={`overflow-hidden transition-all duration-700 ${resultsLoaded ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="border-t border-gray-200 pt-2 mt-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-purple-700">Results from TFRRS</p>
            <p className="text-xs text-gray-400">2025-26 Season</p>
          </div>

          {[
            { event: '100m', mark: '12.41', date: 'Feb 15', pr: true },
            { event: '200m', mark: '25.92', date: 'Feb 8', pr: true },
            { event: '4x100 Relay', mark: '49.87', date: 'Feb 15', pr: false },
          ].map((r, i) => (
            <div key={i} className={`flex items-center justify-between py-1.5 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
              <div>
                <p className="text-xs font-medium text-navy-900">{r.event}</p>
                <p className="text-xs text-gray-400">{r.date}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-bold text-navy-900">{r.mark}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold transition-all duration-500 ${
                  r.pr && prsShown ? 'bg-green-100 text-green-700 opacity-100 scale-100' : 'opacity-0 scale-75 w-0 overflow-hidden'
                }`}>
                  PR
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Not linked state */}
      <div className={`transition-all duration-500 ${!linked ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
        <div className="text-center py-3 border-t border-gray-200 mt-1">
          <p className="text-xs text-gray-400 mb-2">Link TFRRS profile to pull results automatically</p>
          <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg font-medium">+ Connect TFRRS</span>
        </div>
      </div>
    </div>
  )
}

/* ── Carousel Component ── */
const MOCKUP_COMPONENTS = [RosterMockup, MeetEntriesMockup, ParentFavesMockup, TFRRSMockup]

function FeaturesCarousel() {
  const [active, setActive] = useState(0)
  const touchStart = useRef<number | null>(null)
  const touchEnd = useRef<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const len = FEATURE_LABELS.length

  const goTo = useCallback((idx: number) => {
    setActive(((idx % len) + len) % len)
  }, [len])

  const resetAutoplay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setActive(prev => (prev + 1) % len)
    }, 8000)
  }, [len])

  useEffect(() => {
    resetAutoplay()
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [resetAutoplay])

  const handleDotClick = (idx: number) => {
    goTo(idx)
    resetAutoplay()
  }

  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.targetTouches[0].clientX
    touchEnd.current = null
  }
  const onTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientX
  }
  const onTouchEnd = () => {
    if (touchStart.current === null || touchEnd.current === null) return
    const diff = touchStart.current - touchEnd.current
    if (Math.abs(diff) > 50) {
      if (diff > 0) goTo(active + 1)
      else goTo(active - 1)
      resetAutoplay()
    }
    touchStart.current = null
    touchEnd.current = null
  }

  const ActiveMockup = MOCKUP_COMPONENTS[active]

  return (
    <div className="bg-gradient-to-b from-white to-gray-50 py-16 sm:py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Label pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {FEATURE_LABELS.map((f, i) => (
            <button
              key={i}
              onClick={() => handleDotClick(i)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                i === active
                  ? f.color + ' shadow-md scale-105'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Mockup */}
        <div
          className="relative"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <button
            onClick={() => { goTo(active - 1); resetAutoplay() }}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-lg items-center justify-center text-gray-500 hover:text-navy-900 transition-colors z-10 hidden lg:flex"
            aria-label="Previous"
          >
            ←
          </button>
          <button
            onClick={() => { goTo(active + 1); resetAutoplay() }}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-lg items-center justify-center text-gray-500 hover:text-navy-900 transition-colors z-10 hidden lg:flex"
            aria-label="Next"
          >
            →
          </button>

          <div className="max-w-md mx-auto">
            <div key={active} className="bg-gradient-to-br from-navy-900 to-navy-800 rounded-2xl p-5 sm:p-6 shadow-2xl animate-fadeIn">
              <ActiveMockup />
            </div>
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {FEATURE_LABELS.map((_, i) => (
            <button
              key={i}
              onClick={() => handleDotClick(i)}
              className={`rounded-full transition-all duration-300 ${
                i === active ? 'w-8 h-3 bg-brand-500' : 'w-3 h-3 bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Feature ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
