import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Profile } from '../types/database'

export default function Settings() {
  const { isCoach } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    fetchProfiles()
  }, [])

  async function fetchProfiles() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['parent', 'coach'])
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

  async function promoteToCoach(profileId: string) {
    setUpdatingId(profileId)
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'coach', approved: true } as Record<string, unknown>)
      .eq('id', profileId)

    if (error) {
      alert('Failed to promote user: ' + error.message)
    } else {
      await fetchProfiles()
    }
    setUpdatingId(null)
  }

  async function demoteToParent(profileId: string) {
    setUpdatingId(profileId)
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'parent', approved: true } as Record<string, unknown>)
      .eq('id', profileId)

    if (error) {
      alert('Failed to demote user: ' + error.message)
    } else {
      await fetchProfiles()
    }
    setUpdatingId(null)
  }

  const pendingCoachRequests = profiles.filter(p => p.role === 'parent' && p.approved === false)
  const coaches = profiles.filter(p => p.role === 'coach')
  const parents = profiles.filter(p => p.role === 'parent' && p.approved !== false)

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
                <button
                  onClick={() => approveCoach(p.id)}
                  disabled={updatingId === p.id}
                  className="btn-primary text-sm px-3 py-1"
                >
                  {updatingId === p.id ? 'Approving...' : 'Approve Coach'}
                </button>
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
                  <button
                    onClick={() => demoteToParent(coach.id)}
                    disabled={updatingId === coach.id}
                    className="btn-secondary text-sm px-3 py-1"
                  >
                    {updatingId === coach.id ? 'Updating...' : 'Demote to Parent'}
                  </button>
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
            <p className="text-gray-400">No parents found</p>
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
                <button
                  onClick={() => promoteToCoach(parent.id)}
                  disabled={updatingId === parent.id}
                  className="btn-primary text-sm px-3 py-1"
                >
                  {updatingId === parent.id ? 'Promoting...' : 'Promote to Coach'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
