import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useTeam } from '../hooks/useTeam'
import { useSeasons } from '../hooks/useSeasons'
import SeasonModal from '../components/SeasonModal'
import type { Profile, Season } from '../types/database'

export default function Settings() {
  const { isCoach, isAdmin, profile: currentProfile } = useAuth()
  const { guestMode } = useTeam()
  const { seasons, loading: seasonsLoading, addSeason, updateSeason, deleteSeason, setActiveSeason, refetch: refetchSeasons } = useSeasons()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  // Season modal state
  const [showSeasonModal, setShowSeasonModal] = useState(false)
  const [editingSeason, setEditingSeason] = useState<Season | null>(null)
  const [confirmDeleteSeason, setConfirmDeleteSeason] = useState<string | null>(null)

  const effectiveIsCoach = isCoach && !guestMode

  useEffect(() => {
    if (effectiveIsCoach) {
      fetchProfiles()
    } else {
      setLoading(false)
    }
  }, [effectiveIsCoach])

  async function fetchProfiles() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name')
    setProfiles((data as Profile[]) || [])
    setLoading(false)
  }

  async function approveCoach(profileId: string) {
    if (!isAdmin) return
    setUpdatingId(profileId)
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'coach', approved: true } as Record<string, unknown>)
      .eq('id', profileId)

    if (error) {
      alert('Failed to approve coach: ' + error.message)
    } else {
      setProfiles(prev => prev.map(p =>
        p.id === profileId ? { ...p, role: 'coach' as const, approved: true } : p
      ))
    }
    setUpdatingId(null)
  }

  async function disapproveCoach(profileId: string) {
    if (!isAdmin) return
    setUpdatingId(profileId)
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'parent', approved: false } as Record<string, unknown>)
      .eq('id', profileId)

    if (error) {
      alert('Failed to disapprove: ' + error.message)
    } else {
      setProfiles(prev => prev.map(p =>
        p.id === profileId ? { ...p, role: 'parent' as const, approved: false } : p
      ))
    }
    setUpdatingId(null)
  }

  async function demoteCoach(profileId: string) {
    if (!isAdmin) return
    setUpdatingId(profileId)
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'parent', approved: false } as Record<string, unknown>)
      .eq('id', profileId)

    if (error) {
      alert('Failed to demote coach: ' + error.message)
    } else {
      setProfiles(prev => prev.map(p =>
        p.id === profileId ? { ...p, role: 'parent' as const, approved: false } : p
      ))
    }
    setUpdatingId(null)
  }

  async function promoteToCoach(profileId: string) {
    if (!isAdmin) return
    setUpdatingId(profileId)
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'coach', approved: true } as Record<string, unknown>)
      .eq('id', profileId)

    if (error) {
      alert('Failed to promote: ' + error.message)
    } else {
      setProfiles(prev => prev.map(p =>
        p.id === profileId ? { ...p, role: 'coach' as const, approved: true } : p
      ))
    }
    setUpdatingId(null)
  }

  async function deleteAccount(profileId: string) {
    if (!isAdmin) return
    setUpdatingId(profileId)
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', profileId)

    if (error) {
      alert('Failed to delete account: ' + error.message)
    } else {
      setConfirmDelete(null)
      setProfiles(prev => prev.filter(p => p.id !== profileId))
    }
    setUpdatingId(null)
  }

  // Season handlers
  async function handleSaveSeason(data: { name: string; start_date: string; end_date: string | null; is_active: boolean }) {
    if (editingSeason) {
      await updateSeason(editingSeason.id, data)
    } else {
      await addSeason(data)
    }
    setEditingSeason(null)
  }

  async function handleDeleteSeason(id: string) {
    await deleteSeason(id)
    setConfirmDeleteSeason(null)
  }

  async function handleSetActive(id: string) {
    await setActiveSeason(id)
  }

  // Parent/athlete view — just show own account details
  if (!effectiveIsCoach) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Settings</h1>
          <p className="text-gray-600 mt-1">Your account details</p>
        </div>
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-navy-900 mb-4">Account</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium text-navy-900">{currentProfile?.full_name || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-navy-900">{currentProfile?.email || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Role</p>
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                Parent / Viewer
              </span>
            </div>
          </div>
          {currentProfile?.role === 'coach' && !currentProfile?.approved && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">Your coach account is pending approval from an admin.</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-800" />
      </div>
    )
  }

  const pendingCoachRequests = profiles.filter(p => p.role === 'coach' && p.approved === false)
  const coaches = profiles.filter(p => p.role === 'coach' && p.approved === true)
  const parents = profiles.filter(p => p.role === 'parent')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage user accounts, permissions, and seasons</p>
      </div>

      {/* ═══ Season Management ═══ */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-navy-900">
            Season Management ({seasons.length})
          </h2>
          <button
            onClick={() => { setEditingSeason(null); setShowSeasonModal(true) }}
            className="btn-primary text-sm flex items-center space-x-1 min-h-[44px]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>New Season</span>
          </button>
        </div>

        {seasonsLoading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-navy-800" />
          </div>
        ) : seasons.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-gray-400">No seasons created yet</p>
            <button
              onClick={() => { setEditingSeason(null); setShowSeasonModal(true) }}
              className="btn-primary mt-3 text-sm min-h-[44px]"
            >
              Create your first season
            </button>
          </div>
        ) : (
          <div className="card divide-y divide-gray-100">
            {seasons.map(season => (
              <div key={season.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-navy-900">{season.name}</p>
                    {season.is_active && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(season.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {season.end_date && (
                      <> — {new Date(season.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!season.is_active && (
                    <button
                      onClick={() => handleSetActive(season.id)}
                      className="text-xs px-2 py-0.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      Set Active
                    </button>
                  )}
                  <button
                    onClick={() => { setEditingSeason(season); setShowSeasonModal(true) }}
                    className="text-xs px-2 py-0.5 bg-navy-50 text-navy-600 rounded-lg hover:bg-navy-100 transition-colors"
                  >
                    Edit
                  </button>
                  {confirmDeleteSeason === season.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDeleteSeason(season.id)}
                        className="text-xs px-2 py-0.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDeleteSeason(null)}
                        className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteSeason(season.id)}
                      className="text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Season Modal */}
      {showSeasonModal && (
        <SeasonModal
          season={editingSeason}
          onSave={handleSaveSeason}
          onClose={() => { setShowSeasonModal(false); setEditingSeason(null) }}
        />
      )}

      {/* Pending Coach Requests */}
      <div>
        <h2 className="text-lg font-semibold text-navy-900 mb-3">
          Pending Coach Requests ({pendingCoachRequests.length})
        </h2>
        {pendingCoachRequests.length === 0 ? (
          <div className="card text-center py-6">
            <p className="text-gray-400">No pending requests</p>
          </div>
        ) : (
          <div className="card divide-y divide-gray-100">
            {pendingCoachRequests.map(p => (
              <div key={p.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-navy-900">
                    {p.full_name || 'Unnamed'}
                  </p>
                  <p className="text-sm text-gray-500">{p.email}</p>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => approveCoach(p.id)}
                      disabled={updatingId === p.id}
                      className="btn-primary text-sm px-3 py-1"
                    >
                      {updatingId === p.id ? 'Updating...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => disapproveCoach(p.id)}
                      disabled={updatingId === p.id}
                      className="text-sm px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      {updatingId === p.id ? 'Updating...' : 'Disapprove'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Coaches Section */}
      <div>
        <h2 className="text-lg font-semibold text-navy-900 mb-3">
          Coaches ({coaches.length})
        </h2>
        {coaches.length === 0 ? (
          <div className="card text-center py-6">
            <p className="text-gray-400">No coaches found</p>
          </div>
        ) : (
          <div className="card divide-y divide-gray-100">
            {coaches.map(coach => (
              <div key={coach.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-navy-900">
                    {coach.full_name || 'Unnamed'}
                  </p>
                  <p className="text-sm text-gray-500">{coach.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-gold-500 text-navy-900 px-2 py-0.5 rounded-full font-medium">
                    Coach
                  </span>
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => demoteCoach(coach.id)}
                        disabled={updatingId === coach.id}
                        className="text-xs px-2 py-0.5 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors"
                      >
                        Demote
                      </button>
                      {confirmDelete === coach.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => deleteAccount(coach.id)}
                            disabled={updatingId === coach.id}
                            className="text-xs px-2 py-0.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(coach.id)}
                          className="text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Parents Section */}
      <div>
        <h2 className="text-lg font-semibold text-navy-900 mb-3">
          Parents ({parents.length})
        </h2>
        {parents.length === 0 ? (
          <div className="card text-center py-6">
            <p className="text-gray-400">No parent accounts</p>
          </div>
        ) : (
          <div className="card divide-y divide-gray-100">
            {parents.map(parent => (
              <div key={parent.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-navy-900">
                    {parent.full_name || 'Unnamed'}
                  </p>
                  <p className="text-sm text-gray-500">{parent.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                    Parent
                  </span>
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => promoteToCoach(parent.id)}
                        disabled={updatingId === parent.id}
                        className="text-xs px-2 py-0.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                      >
                        Promote to Coach
                      </button>
                      {confirmDelete === parent.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => deleteAccount(parent.id)}
                            disabled={updatingId === parent.id}
                            className="text-xs px-2 py-0.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(parent.id)}
                          className="text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
