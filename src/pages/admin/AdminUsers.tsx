import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import type { Profile, Team } from '../../types/database'

interface UserWithTeam extends Profile {
  team_name: string | null
  team_slug: string | null
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserWithTeam[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [teamFilter, setTeamFilter] = useState<string>('all')
  const [saving, setSaving] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<UserWithTeam | null>(null)
  const [editingUser, setEditingUser] = useState<UserWithTeam | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [profilesRes, teamsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('teams').select('*').order('name'),
      ])

      const profilesData = (profilesRes.data || []) as Profile[]
      const teamsData = (teamsRes.data || []) as Team[]
      setTeams(teamsData)

      const enriched: UserWithTeam[] = profilesData.map((p) => {
        const team = teamsData.find((t) => t.id === p.team_id)
        return {
          ...p,
          team_name: team?.name || null,
          team_slug: team?.slug || null,
        }
      })

      setUsers(enriched)
    } catch (err) {
      console.error('Failed to fetch users:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filtered = users.filter((u) => {
    const matchesSearch =
      !search ||
      (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    const matchesTeam = teamFilter === 'all' || u.team_id === teamFilter || (teamFilter === 'none' && !u.team_id)
    return matchesSearch && matchesRole && matchesTeam
  })

  async function toggleSuperAdmin(user: UserWithTeam) {
    setSaving(user.id)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_super_admin: !user.is_super_admin } as Record<string, unknown>)
        .eq('id', user.id)
      if (error) throw error
      await fetchData()
    } catch (err) {
      console.error('Failed to toggle super admin:', err)
      alert('Failed to update user')
    } finally {
      setSaving(null)
    }
  }

  async function toggleApproved(user: UserWithTeam) {
    setSaving(user.id)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ approved: !user.approved } as Record<string, unknown>)
        .eq('id', user.id)
      if (error) throw error
      await fetchData()
    } catch (err) {
      console.error('Failed to toggle approved:', err)
      alert('Failed to update user')
    } finally {
      setSaving(null)
    }
  }

  async function handleSaveUser() {
    if (!editingUser) return
    setSaving(editingUser.id)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role: editingUser.role,
          team_id: editingUser.team_id,
          approved: editingUser.approved,
          is_super_admin: editingUser.is_super_admin,
        } as Record<string, unknown>)
        .eq('id', editingUser.id)
      if (error) throw error
      setEditingUser(null)
      await fetchData()
    } catch (err) {
      console.error('Failed to save user:', err)
      alert('Failed to save user')
    } finally {
      setSaving(null)
    }
  }

  async function handleDeleteUser(user: UserWithTeam) {
    setSaving(user.id)
    try {
      // Delete favorites for this user
      await supabase.from('favorites').delete().eq('profile_id', user.id)
      // Delete the profile
      const { error } = await supabase.from('profiles').delete().eq('id', user.id)
      if (error) throw error
      setDeleteConfirm(null)
      await fetchData()
    } catch (err) {
      console.error('Failed to delete user:', err)
      alert('Failed to delete user')
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <p className="text-gray-400 mt-1">{users.length} users total</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Roles</option>
          <option value="coach">Coach</option>
          <option value="parent">Parent</option>
          <option value="athlete">Athlete</option>
          <option value="admin">Admin</option>
        </select>
        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className="px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Teams</option>
          <option value="none">No Team</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left p-4 text-gray-400 font-medium">User</th>
                <th className="text-left p-4 text-gray-400 font-medium hidden md:table-cell">Team</th>
                <th className="text-left p-4 text-gray-400 font-medium">Role</th>
                <th className="text-center p-4 text-gray-400 font-medium">Approved</th>
                <th className="text-center p-4 text-gray-400 font-medium hidden md:table-cell">Super Admin</th>
                <th className="text-right p-4 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="p-4">
                    <div>
                      <div className="font-medium text-white">{user.full_name || 'Unnamed'}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    {user.team_name ? (
                      <a
                        href={`/t/${user.team_slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 text-sm"
                      >
                        {user.team_name}
                      </a>
                    ) : (
                      <span className="text-gray-600 text-sm">—</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      user.role === 'coach' ? 'bg-blue-500/20 text-blue-400' :
                      user.role === 'parent' ? 'bg-purple-500/20 text-purple-400' :
                      user.role === 'athlete' ? 'bg-green-500/20 text-green-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => toggleApproved(user)}
                      disabled={saving === user.id}
                      className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                        user.approved
                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                          : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      }`}
                    >
                      {user.approved ? '✓ Yes' : '✗ No'}
                    </button>
                  </td>
                  <td className="p-4 text-center hidden md:table-cell">
                    <button
                      onClick={() => toggleSuperAdmin(user)}
                      disabled={saving === user.id}
                      className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                        user.is_super_admin
                          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                          : 'bg-gray-500/20 text-gray-500 hover:bg-gray-500/30'
                      }`}
                    >
                      {user.is_super_admin ? '⚡ Yes' : 'No'}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingUser({ ...user })}
                        className="px-2 py-1 text-xs text-gray-400 hover:text-white border border-gray-700 rounded hover:bg-gray-800 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(user)}
                        className="px-2 py-1 text-xs text-red-400 hover:text-red-300 border border-red-800/50 rounded hover:bg-red-900/30 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setEditingUser(null)} />
          <div className="relative w-full max-w-lg bg-gray-900 border border-gray-700 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">Edit User</h2>
              <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-white p-1">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">User</div>
                <div className="text-white font-medium">{editingUser.full_name || 'Unnamed'}</div>
                <div className="text-xs text-gray-400">{editingUser.email}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as Profile['role'] })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="coach">Coach</option>
                  <option value="parent">Parent</option>
                  <option value="athlete">Athlete</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Team</label>
                <select
                  value={editingUser.team_id || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, team_id: e.target.value || null })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">No Team</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingUser.approved}
                    onChange={(e) => setEditingUser({ ...editingUser, approved: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-600"
                  />
                  <span className="text-sm text-gray-300">Approved</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingUser.is_super_admin}
                    onChange={(e) => setEditingUser({ ...editingUser, is_super_admin: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-600"
                  />
                  <span className="text-sm text-gray-300">Super Admin</span>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditingUser(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveUser}
                  disabled={saving === editingUser.id}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {saving === editingUser.id ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDeleteConfirm(null)} />
          <div className="relative w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-xl p-6">
            <div className="space-y-4">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400 font-medium">
                  ⚠️ Delete user: {deleteConfirm.full_name || deleteConfirm.email}?
                </p>
                <p className="text-red-400/70 text-sm mt-1">
                  This will remove their profile and favorites. This cannot be undone.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteUser(deleteConfirm)}
                  disabled={saving === deleteConfirm.id}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {saving === deleteConfirm.id ? 'Deleting...' : 'Delete User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
