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
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
        <p className="text-gray-400 mt-1">TrackRoster platform at a glance</p>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Teams" value={stats.totalTeams} color="indigo" icon="🏟️" />
          <StatCard label="Active Teams" value={stats.activeTeams} color="green" icon="✅" />
          <StatCard label="Total Users" value={stats.totalUsers} color="blue" icon="👥" />
          <StatCard label="Total Athletes" value={stats.totalAthletes} color="purple" icon="🏃" />
        </div>
      )}

      {/* Revenue Overview */}
      {stats && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Revenue Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-400">{stats.subscribedTeams}</div>
              <div className="text-sm text-gray-400">Stripe Subscriptions</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-amber-400">{stats.grandfatheredTeams}</div>
              <div className="text-sm text-gray-400">Grandfathered (Free)</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-400">{stats.freeTeams}</div>
              <div className="text-sm text-gray-400">No Subscription</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Teams */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Team Signups</h2>
        {recentTeams.length === 0 ? (
          <p className="text-gray-500">No teams yet</p>
        ) : (
          <div className="space-y-3">
            {recentTeams.map((team) => (
              <div key={team.id} className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: team.primary_color }}
                  >
                    {team.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{team.name}</div>
                    <div className="text-xs text-gray-500">{team.school_name} · /{team.slug}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {team.is_grandfathered && (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">Grandfathered</span>
                  )}
                  {team.stripe_subscription_id && (
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">Subscribed</span>
                  )}
                  {!team.active && (
                    <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">Inactive</span>
                  )}
                  <span className="text-xs text-gray-500">
                    {new Date(team.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Users */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Users</h2>
        {recentUsers.length === 0 ? (
          <p className="text-gray-500">No users yet</p>
        ) : (
          <div className="space-y-2">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3">
                <div>
                  <div className="text-sm font-medium text-white">{user.full_name || 'Unnamed'}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    user.role === 'coach' ? 'bg-blue-500/20 text-blue-400' :
                    user.role === 'parent' ? 'bg-purple-500/20 text-purple-400' :
                    user.role === 'athlete' ? 'bg-green-500/20 text-green-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {user.role}
                  </span>
                  {user.is_super_admin && (
                    <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">Super Admin</span>
                  )}
                  <span className="text-xs text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
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
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${colorMap[color]}`}>
          {icon}
        </span>
        <span className="text-xs text-gray-500 uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
    </div>
  )
}
