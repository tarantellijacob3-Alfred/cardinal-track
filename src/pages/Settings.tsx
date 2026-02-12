import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Profile } from '../types/database'

export default function Settings() {
  const { isCoach, isAdmin } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    fetchProfiles()
  }, [])

  async function fetchProfiles() {
    setLoading(true)
    // Migrate any legacy parent/athlete accounts to unapproved coaches
    await supabase
      .from('profiles')
      .update({ role: 'coach', approved: false } as Record<string, unknown>)
      .in('role', ['parent', 'athlete'])

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name')
    setProfiles((data as Profile[]) || [])
    setLoading(false)
  }

  async function approveCoach(profileId: string) {
    setUpdatingId(profileId)
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'coach', approved: true } as Record<string, unknown>)
      .eq('id', profileId)

    if (error) {
      alert('Failed to approve coach: ' + error.message)
    } else {
      await fetchProfiles()
    }
    setUpdatingId(null)
  }

  async function disapproveCoach(profileId: string) {
    setUpdatingId(profileId)
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'parent', approved: false } as Record<string, unknown>)
      .eq('id', profileId)

    if (error) {
      alert('Failed to disapprove coach: ' + error.message)
    } else {
      await fetchProfiles()
    }
    setUpdatingId(null)
  }

  async function demoteCoach(profileId: string) {
    setUpdatingId(profileId)
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'parent', approved: false } as Record<string, unknown>)
      .eq('id', profileId)

    if (error) {
      alert('Failed to demote coach: ' + error.message)
    } else {
      await fetchProfiles()
    }
    setUpdatingId(null)
  }

  async function deleteAccount(profileId: string) {
    setUpdatingId(profileId)
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', profileId)

    if (error) {
      alert('Failed to delete account: ' + error.message)
    } else {
      setConfirmDelete(null)
      await fetchProfiles()
    }
    setUpdatingId(null)
  }

  const pendingCoachRequests = profiles.filter(p => p.approved === false && p.role !== 'parent')
  const coaches = profiles.filter(p => p.approved === true && p.role === 'coach')
  const admins = profiles.filter(p => p.role === 'admin')
  const viewers = profiles.filter(p => p.role === 'parent')

  if (!isCoach) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-navy-900">Access Denied</h2>
        <p className="mt-2 text-gray-600">You need an approved coach account to access settings.</p>
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage user accounts and permissions</p>
      </div>

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
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => approveCoach(p.id)}
                    disabled={updatingId === p.id}
                    className="btn-primary text-sm px-3 py-1"
                  >
                    {updatingId === p.id ? 'Approving...' : 'Approve'}
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => disapproveCoach(p.id)}
                      disabled={updatingId === p.id}
                      className="text-sm px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      Disapprove
                    </button>
                  )}
                </div>
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

      {/* Admins Section */}
      {admins.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-navy-900 mb-3">
            Admins ({admins.length})
          </h2>
          <div className="card divide-y divide-gray-100">
            {admins.map(admin => (
              <div key={admin.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-navy-900">
                    {admin.full_name || 'Unnamed'}
                  </p>
                  <p className="text-sm text-gray-500">{admin.email}</p>
                </div>
                <span className="text-xs bg-navy-800 text-white px-2 py-0.5 rounded-full font-medium">
                  Admin
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Viewers (Disapproved/Demoted) */}
      {isAdmin && viewers.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-navy-900 mb-3">
            Viewers / Parents ({viewers.length})
          </h2>
          <div className="card divide-y divide-gray-100">
            {viewers.map(viewer => (
              <div key={viewer.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-navy-900">
                    {viewer.full_name || 'Unnamed'}
                  </p>
                  <p className="text-sm text-gray-500">{viewer.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                    Viewer
                  </span>
                  <button
                    onClick={() => approveCoach(viewer.id)}
                    disabled={updatingId === viewer.id}
                    className="text-xs px-2 py-0.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    Promote to Coach
                  </button>
                  {confirmDelete === viewer.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => deleteAccount(viewer.id)}
                        disabled={updatingId === viewer.id}
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
                      onClick={() => setConfirmDelete(viewer.id)}
                      className="text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
