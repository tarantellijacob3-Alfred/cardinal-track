import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import type { Team } from '../../types/database'

interface TeamWithCounts extends Team {
  athlete_count: number
  meet_count: number
}

interface EditingTeam {
  id: string
  name: string
  school_name: string
  slug: string
  primary_color: string
  secondary_color: string
  logo_url: string
  active: boolean
  is_grandfathered: boolean
}

const emptyNewTeam = {
  name: '',
  school_name: '',
  slug: '',
  primary_color: '#8B0000',
  secondary_color: '#1a1a2e',
  logo_url: '',
  active: true,
  is_grandfathered: false,
}

export default function AdminTeams() {
  const [teams, setTeams] = useState<TeamWithCounts[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editingTeam, setEditingTeam] = useState<EditingTeam | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newTeam, setNewTeam] = useState(emptyNewTeam)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<Team | null>(null)

  const fetchTeams = useCallback(async () => {
    try {
      const [teamsRes, athletesRes, meetsRes] = await Promise.all([
        supabase.from('teams').select('*').order('created_at', { ascending: false }),
        supabase.from('athletes').select('id, team_id'),
        supabase.from('meets').select('id, team_id'),
      ])

      const teamsData = (teamsRes.data || []) as Team[]
      const athletes = athletesRes.data || []
      const meets = meetsRes.data || []

      const enriched: TeamWithCounts[] = teamsData.map((t) => ({
        ...t,
        athlete_count: athletes.filter((a) => a.team_id === t.id).length,
        meet_count: meets.filter((m) => m.team_id === t.id).length,
      }))

      setTeams(enriched)
    } catch (err) {
      console.error('Failed to fetch teams:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  const filtered = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.school_name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase())
  )

  async function handleSaveEdit() {
    if (!editingTeam) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('teams')
        .update({
          name: editingTeam.name,
          school_name: editingTeam.school_name,
          slug: editingTeam.slug,
          primary_color: editingTeam.primary_color,
          secondary_color: editingTeam.secondary_color,
          logo_url: editingTeam.logo_url || null,
          active: editingTeam.active,
          is_grandfathered: editingTeam.is_grandfathered,
        })
        .eq('id', editingTeam.id)

      if (error) throw error
      setEditingTeam(null)
      await fetchTeams()
    } catch (err) {
      console.error('Failed to update team:', err)
      alert('Failed to update team')
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateTeam() {
    if (!newTeam.name || !newTeam.slug || !newTeam.school_name) {
      alert('Name, school, and slug are required')
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.from('teams').insert({
        name: newTeam.name,
        school_name: newTeam.school_name,
        slug: newTeam.slug,
        primary_color: newTeam.primary_color,
        secondary_color: newTeam.secondary_color,
        logo_url: newTeam.logo_url || null,
        active: newTeam.active,
        is_grandfathered: newTeam.is_grandfathered,
      })

      if (error) throw error
      setShowCreate(false)
      setNewTeam(emptyNewTeam)
      await fetchTeams()
    } catch (err) {
      console.error('Failed to create team:', err)
      alert('Failed to create team')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteTeam(team: Team) {
    setSaving(true)
    try {
      // Delete athletes, meets, seasons (cascading should handle meet_entries, tfrrs_meet_links)
      await supabase.from('athletes').delete().eq('team_id', team.id)
      await supabase.from('meets').delete().eq('team_id', team.id)
      await supabase.from('seasons').delete().eq('team_id', team.id)
      // Update profiles to remove team assignment
      await supabase.from('profiles').update({ team_id: null } as Record<string, unknown>).eq('team_id', team.id)
      // Delete the team
      const { error } = await supabase.from('teams').delete().eq('id', team.id)
      if (error) throw error
      setDeleteConfirm(null)
      await fetchTeams()
    } catch (err) {
      console.error('Failed to delete team:', err)
      alert('Failed to delete team')
    } finally {
      setSaving(false)
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Team Management</h1>
          <p className="text-gray-400 mt-1">{teams.length} teams total</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm"
        >
          + Create Team
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search teams..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
      />

      {/* Teams Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left p-4 text-gray-400 font-medium">Team</th>
                <th className="text-left p-4 text-gray-400 font-medium hidden md:table-cell">Slug</th>
                <th className="text-left p-4 text-gray-400 font-medium hidden lg:table-cell">Created</th>
                <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                <th className="text-center p-4 text-gray-400 font-medium">Athletes</th>
                <th className="text-center p-4 text-gray-400 font-medium hidden md:table-cell">Meets</th>
                <th className="text-right p-4 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((team) => (
                <tr key={team.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: team.primary_color }}
                      >
                        {team.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-white">{team.name}</div>
                        <div className="text-xs text-gray-500">{team.school_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-gray-400 hidden md:table-cell font-mono text-xs">{team.slug}</td>
                  <td className="p-4 text-gray-500 hidden lg:table-cell text-xs">
                    {new Date(team.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {!team.active && (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">Inactive</span>
                      )}
                      {team.is_grandfathered && (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">Free</span>
                      )}
                      {team.stripe_subscription_id && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">Paid</span>
                      )}
                      {!team.stripe_subscription_id && !team.is_grandfathered && team.active && (
                        <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 text-xs rounded-full">None</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-center text-gray-300">{team.athlete_count}</td>
                  <td className="p-4 text-center text-gray-300 hidden md:table-cell">{team.meet_count}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/t/${team.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 text-xs text-gray-400 hover:text-white border border-gray-700 rounded hover:bg-gray-800 transition-colors"
                        title="View as Team"
                      >
                        👁️
                      </a>
                      <button
                        onClick={() =>
                          setEditingTeam({
                            id: team.id,
                            name: team.name,
                            school_name: team.school_name,
                            slug: team.slug,
                            primary_color: team.primary_color,
                            secondary_color: team.secondary_color,
                            logo_url: team.logo_url || '',
                            active: team.active,
                            is_grandfathered: team.is_grandfathered,
                          })
                        }
                        className="px-2 py-1 text-xs text-gray-400 hover:text-white border border-gray-700 rounded hover:bg-gray-800 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(team)}
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
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    No teams found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingTeam && (
        <Modal title="Edit Team" onClose={() => setEditingTeam(null)}>
          <TeamForm
            values={editingTeam}
            onChange={(updates) => setEditingTeam({ ...editingTeam, ...updates })}
            onSave={handleSaveEdit}
            onCancel={() => setEditingTeam(null)}
            saving={saving}
            saveLabel="Save Changes"
          />
        </Modal>
      )}

      {/* Create Modal */}
      {showCreate && (
        <Modal title="Create New Team" onClose={() => setShowCreate(false)}>
          <TeamForm
            values={newTeam}
            onChange={(updates) => setNewTeam({ ...newTeam, ...updates })}
            onSave={handleCreateTeam}
            onCancel={() => setShowCreate(false)}
            saving={saving}
            saveLabel="Create Team"
          />
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <Modal title="Delete Team" onClose={() => setDeleteConfirm(null)}>
          <div className="space-y-4">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400 font-medium">⚠️ This will permanently delete {deleteConfirm.name} and ALL its data.</p>
              <p className="text-red-400/70 text-sm mt-1">
                Athletes, meets, meet entries, seasons, TFRRS links — everything. This cannot be undone.
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
                onClick={() => handleDeleteTeam(deleteConfirm)}
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

/* ────── Shared Components ────── */

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-gray-900 border border-gray-700 rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

interface TeamFormValues {
  name: string
  school_name: string
  slug: string
  primary_color: string
  secondary_color: string
  logo_url: string
  active: boolean
  is_grandfathered: boolean
}

function TeamForm({
  values,
  onChange,
  onSave,
  onCancel,
  saving,
  saveLabel,
}: {
  values: TeamFormValues
  onChange: (updates: Partial<TeamFormValues>) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
  saveLabel: string
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Team Name</label>
        <input
          type="text"
          value={values.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">School Name</label>
        <input
          type="text"
          value={values.school_name}
          onChange={(e) => onChange({ school_name: e.target.value })}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Slug</label>
        <input
          type="text"
          value={values.slug}
          onChange={(e) => onChange({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Primary Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={values.primary_color}
              onChange={(e) => onChange({ primary_color: e.target.value })}
              className="w-10 h-10 rounded cursor-pointer border-0"
            />
            <input
              type="text"
              value={values.primary_color}
              onChange={(e) => onChange({ primary_color: e.target.value })}
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Secondary Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={values.secondary_color}
              onChange={(e) => onChange({ secondary_color: e.target.value })}
              className="w-10 h-10 rounded cursor-pointer border-0"
            />
            <input
              type="text"
              value={values.secondary_color}
              onChange={(e) => onChange({ secondary_color: e.target.value })}
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Logo URL</label>
        <input
          type="text"
          value={values.logo_url}
          onChange={(e) => onChange({ logo_url: e.target.value })}
          placeholder="https://..."
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
        />
      </div>
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={values.active}
            onChange={(e) => onChange({ active: e.target.checked })}
            className="w-4 h-4 rounded border-gray-600"
          />
          <span className="text-sm text-gray-300">Active</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={values.is_grandfathered}
            onChange={(e) => onChange({ is_grandfathered: e.target.checked })}
            className="w-4 h-4 rounded border-gray-600"
          />
          <span className="text-sm text-gray-300">Grandfathered (Free)</span>
        </label>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : saveLabel}
        </button>
      </div>
    </div>
  )
}
