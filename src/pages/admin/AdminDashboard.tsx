import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Team, Profile } from '../../types/database'

interface Stats {
  totalTeams: number
  activeTeams: number
  totalUsers: number
  totalAthletes: number
  subscribedTeams: number
  grandfatheredTeams: number
  freeTeams: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentTeams, setRecentTeams] = useState<Team[]>([])
  const [recentUsers, setRecentUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const [teamsRes, profilesRes, athletesRes] = await Promise.all([
          supabase.from('teams').select('*'),
          supabase.from('profiles').select('*'),
          supabase.from('athletes').select('id', { count: 'exact', head: true }),
        ])

        const teams = (teamsRes.data || []) as Team[]
        const profiles = (profilesRes.data || []) as Profile[]

        const activeTeams = teams.filter((t) => t.active)
        const subscribedTeams = teams.filter((t) => t.stripe_subscription_id)
        const grandfatheredTeams = teams.filter((t) => t.is_grandfathered)
        const freeTeams = teams.filter((t) => !t.stripe_subscription_id && !t.is_grandfathered)

        setStats({
          totalTeams: teams.length,
          activeTeams: activeTeams.length,
          totalUsers: profiles.length,
          totalAthletes: athletesRes.count || 0,
          subscribedTeams: subscribedTeams.length,
          grandfatheredTeams: grandfatheredTeams.length,
          freeTeams: freeTeams.length,
        })

        // Recent teams (last 5 created)
        const sorted = [...teams].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        setRecentTeams(sorted.slice(0, 5))

        // Recent users (last 10)
        const sortedUsers = [...profiles].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        setRecentUsers(sortedUsers.slice(0, 10))
      } catch (err) {
        console.error('Failed to fetch admin stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white">Dashboard Overview</h1>
        <p className="text-gray-400 mt-1 text-sm">TrackRoster platform at a glance</p>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <StatCard label="Total Teams" value={stats.totalTeams} color="indigo" icon="🏟️" />
          <StatCard label="Active Teams" value={stats.activeTeams} color="green" icon="✅" />
          <StatCard label="Total Users" value={stats.totalUsers} color="blue" icon="👥" />
          <StatCard label="Total Athletes" value={stats.totalAthletes} color="purple" icon="🏃" />
        </div>
      )}

      {/* Revenue Overview */}
      {stats && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4">Revenue Overview</h2>
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            <div className="bg-gray-800/50 rounded-lg p-3 md:p-4 text-center md:text-left">
              <div className="text-xl md:text-2xl font-bold text-green-400">{stats.subscribedTeams}</div>
              <div className="text-xs md:text-sm text-gray-400">Paid</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 md:p-4 text-center md:text-left">
              <div className="text-xl md:text-2xl font-bold text-amber-400">{stats.grandfatheredTeams}</div>
              <div className="text-xs md:text-sm text-gray-400">Free</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 md:p-4 text-center md:text-left">
              <div className="text-xl md:text-2xl font-bold text-gray-400">{stats.freeTeams}</div>
              <div className="text-xs md:text-sm text-gray-400">No Sub</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Teams */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4">Recent Team Signups</h2>
        {recentTeams.length === 0 ? (
          <p className="text-gray-500">No teams yet</p>
        ) : (
          <div className="space-y-2 md:space-y-3">
            {recentTeams.map((team) => (
              <div key={team.id} className="bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ backgroundColor: team.primary_color }}
                  >
                    {team.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{team.name}</div>
                    <div className="text-xs text-gray-500 truncate">{team.school_name}</div>
                  </div>
                  <span className="text-xs text-gray-500 shrink-0 hidden sm:inline">
                    {new Date(team.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-2 ml-12 md:ml-[52px]">
                  {team.is_grandfathered && (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">Free</span>
                  )}
                  {team.stripe_subscription_id && (
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">Paid</span>
                  )}
                  {!team.active && (
                    <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">Inactive</span>
                  )}
                  <span className="text-xs text-gray-500 sm:hidden">
                    {new Date(team.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Users */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4">Recent Users</h2>
        {recentUsers.length === 0 ? (
          <p className="text-gray-500">No users yet</p>
        ) : (
          <div className="space-y-2">
            {recentUsers.map((user) => (
              <div key={user.id} className="bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-white truncate">{user.full_name || 'Unnamed'}</div>
                    <div className="text-xs text-gray-500 truncate">{user.email}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      user.role === 'coach' ? 'bg-blue-500/20 text-blue-400' :
                      user.role === 'parent' ? 'bg-purple-500/20 text-purple-400' :
                      user.role === 'athlete' ? 'bg-green-500/20 text-green-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {user.role}
                    </span>
                    {user.is_super_admin && (
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">SA</span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Joined {new Date(user.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-500/20 text-indigo-400',
    green: 'bg-green-500/20 text-green-400',
    blue: 'bg-blue-500/20 text-blue-400',
    purple: 'bg-purple-500/20 text-purple-400',
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 md:p-4">
      <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
        <span className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-xs md:text-sm ${colorMap[color]}`}>
          {icon}
        </span>
        <span className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wide leading-tight">{label}</span>
      </div>
      <div className="text-2xl md:text-3xl font-bold text-white">{value}</div>
    </div>
  )
}
