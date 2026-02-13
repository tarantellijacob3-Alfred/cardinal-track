import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import type { Season, Team } from '../../types/database'

interface SeasonWithTeam extends Season {
  team_name: string
  team_slug: string
}

export default function AdminSeasons() {
  const [seasons, setSeasons] = useState<SeasonWithTeam[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [teamFilter, setTeamFilter] = useState<string>('all')
  const [editing, setEditing] = useState<SeasonWithTeam | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<SeasonWithTeam | null>(null)
  const [newSeason, setNewSeason] = useState({
    team_id: '',
    name: '',
    start_date: '',
    end_date: '',
    is_active: false,
  })

  const fetchData = useCallback(async () => {
    try {
      const [seasonsRes, teamsRes] = await Promise.all([
        supabase.from('seasons').select('*').order('created_at', { ascending: false }),
        supabase.from('teams').select('*').order('name'),
      ])

      const seasonsData = (seasonsRes.data || []) as Season[]
      const teamsData = (teamsRes.data || []) as Team[]
      setTeams(teamsData)

      const enriched: SeasonWithTeam[] = seasonsData.map((s) => {
        const team = teamsData.find((t) => t.id === s.team_id)
        return {
          ...s,
          team_name: team?.name || 'Unknown',
          team_slug: team?.slug || '',
        }
      })

      setSeasons(enriched)
    } catch (err) {
      console.error('Failed to fetch seasons:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filtered = seasons.filter(
    (s) => teamFilter === 'all' || s.team_id === teamFilter
  )

  async function handleCreate() {
    if (!newSeason.team_id || !newSeason.name || !newSeason.start_date) {
      alert('Team, name, and start date are required')
      return
    }
    setSaving(true)
    try {
      // If setting as active, deactivate other seasons for this team
      if (newSeason.is_active) {
        await supabase
          .from('seasons')
          .update({ is_active: false })
          .eq('team_id', newSeason.team_id)
      }

      const { error } = await supabase.from('seasons').insert({
        team_id: newSeason.team_id,
        name: newSeason.name,
        start_date: newSeason.start_date,
        end_date: newSeason.end_date || null,
        is_active: newSeason.is_active,
      })

      if (error) throw error
      setShowCreate(false)
      setNewSeason({ team_id: '', name: '', start_date: '', end_date: '', is_active: false })
      await fetchData()
    } catch (err) {
      console.error('Failed to create season:', err)
      alert('Failed to create season')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveEdit() {
    if (!editing) return
    setSaving(true)
    try {
      // If setting as active, deactivate other seasons for this team
      if (editing.is_active) {
        await supabase
          .from('seasons')
          .update({ is_active: false })
          .eq('team_id', editing.team_id)
      }

      const { error } = await supabase
        .from('seasons')
        .update({
          name: editing.name,
          start_date: editing.start_date,
          end_date: editing.end_date || null,
          is_active: editing.is_active,
        })
        .eq('id', editing.id)

      if (error) throw error
      setEditing(null)
      await fetchData()
    } catch (err) {
      console.error('Failed to update season:', err)
      alert('Failed to update season')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(season: SeasonWithTeam) {
    setSaving(true)
    try {
      const { error } = await supabase.from('seasons').delete().eq('id', season.id)
      if (error) throw error
      setDeleteConfirm(null)
      await fetchData()
    } catch (err) {
      console.error('Failed to delete season:', err)
      alert('Failed to delete season')
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
          <h1 className="text-2xl font-bold text-white">Season Management</h1>
          <p className="text-gray-400 mt-1">{seasons.length} seasons across all teams</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm"
        >
          + Create Season
        </button>
      </div>

      {/* Filter */}
      <select
        value={teamFilter}
        onChange={(e) => setTeamFilter(e.target.value)}
        className="px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
      >
        <option value="all">All Teams</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>

      {/* Seasons Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left p-4 text-gray-400 font-medium">Season</th>
                <th className="text-left p-4 text-gray-400 font-medium">Team</th>
                <th className="text-left p-4 text-gray-400 font-medium hidden md:table-cell">Start</th>
                <th className="text-left p-4 text-gray-400 font-medium hidden md:table-cell">End</th>
                <th className="text-center p-4 text-gray-400 font-medium">Active</th>
                <th className="text-right p-4 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((season) => (
                <tr key={season.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="p-4">
                    <div className="font-medium text-white">{season.name}</div>
                  </td>
                  <td className="p-4">
                    <a
                      href={`/t/${season.team_slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 text-sm"
                    >
                      {season.team_name}
                    </a>
                  </td>
                  <td className="p-4 text-gray-400 hidden md:table-cell">
                    {new Date(season.start_date + 'T00:00:00').toLocaleDateString()}
                  </td>
                  <td className="p-4 text-gray-400 hidden md:table-cell">
                    {season.end_date ? new Date(season.end_date + 'T00:00:00').toLocaleDateString() : '—'}
                  </td>
                  <td className="p-4 text-center">
                    {season.is_active ? (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">Active</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-gray-500/20 text-gray-500 text-xs rounded-full">Inactive</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditing({ ...season })}
                        className="px-2 py-1 text-xs text-gray-400 hover:text-white border border-gray-700 rounded hover:bg-gray-800 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(season)}
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
                    No seasons found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowCreate(false)} />
          <div className="relative w-full max-w-lg bg-gray-900 border border-gray-700 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">Create Season</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white p-1">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Team</label>
                <select
                  value={newSeason.team_id}
                  onChange={(e) => setNewSeason({ ...newSeason, team_id: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select a team...</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Season Name</label>
                <input
                  type="text"
                  value={newSeason.name}
                  onChange={(e) => setNewSeason({ ...newSeason, name: e.target.value })}
                  placeholder="e.g. Spring 2026"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newSeason.start_date}
                    onChange={(e) => setNewSeason({ ...newSeason, start_date: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">End Date</label>
                  <input
                    type="date"
                    value={newSeason.end_date}
                    onChange={(e) => setNewSeason({ ...newSeason, end_date: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newSeason.is_active}
                  onChange={(e) => setNewSeason({ ...newSeason, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-600"
                />
                <span className="text-sm text-gray-300">Set as active season</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Season'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setEditing(null)} />
          <div className="relative w-full max-w-lg bg-gray-900 border border-gray-700 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">Edit Season</h2>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-white p-1">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">Team</div>
                <div className="text-white font-medium">{editing.team_name}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Season Name</label>
                <input
                  type="text"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={editing.start_date}
                    onChange={(e) => setEditing({ ...editing, start_date: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">End Date</label>
                  <input
                    type="date"
                    value={editing.end_date || ''}
                    onChange={(e) => setEditing({ ...editing, end_date: e.target.value || null })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.is_active}
                  onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-600"
                />
                <span className="text-sm text-gray-300">Active season</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditing(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
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
                  ⚠️ Delete season: {deleteConfirm.name} ({deleteConfirm.team_name})?
                </p>
                <p className="text-red-400/70 text-sm mt-1">
                  Meets linked to this season will have their season_id set to null.
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
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Deleting...' : 'Delete Season'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
