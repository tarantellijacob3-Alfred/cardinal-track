import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useTeam } from '../hooks/useTeam'
import { useSeasons } from '../hooks/useSeasons'
import SeasonModal from '../components/SeasonModal'
import type { Profile, Season, Team } from '../types/database'

function TeamBrandingSection({ team, teamId }: { team: Team | null; teamId: string | null }) {
  const [primaryColor, setPrimaryColor] = useState(team?.primary_color || '#1e3a5f')
  const [secondaryColor, setSecondaryColor] = useState(team?.secondary_color || '#c5a900')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(team?.logo_url || null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  if (!team || !teamId) return null

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)

    try {
      let logoUrl = team.logo_url

      // Upload new logo if provided
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop()
        const filePath = `team-logos/${team.slug}.${fileExt}`
        const { error: uploadErr } = await supabase.storage
          .from('public')
          .upload(filePath, logoFile, { upsert: true })

        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('public').getPublicUrl(filePath)
          logoUrl = urlData.publicUrl
        }
      }

      const { error } = await supabase
        .from('teams')
        .update({
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          logo_url: logoUrl,
        } as Record<string, unknown>)
        .eq('id', teamId)

      if (error) {
        alert('Failed to save: ' + error.message)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
        // Reload to reflect new colors
        setTimeout(() => window.location.reload(), 500)
      }
    } catch (err) {
      alert('Failed to save branding')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-navy-900 mb-4">Team Branding</h2>

      <div className="space-y-4">
        {/* Logo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Team Logo</label>
          <div className="flex items-center space-x-4">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="w-16 h-16 object-contain rounded-lg border border-gray-200" />
            ) : (
              <div
                className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: primaryColor }}
              >
                {team.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-navy-50 file:text-navy-700 hover:file:bg-navy-100"
              />
              <p className="text-xs text-gray-400 mt-1">PNG, JPG, or SVG recommended</p>
            </div>
          </div>
        </div>

        {/* Colors */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={primaryColor}
                onChange={e => setPrimaryColor(e.target.value)}
                className="w-10 h-10 rounded border border-gray-200 cursor-pointer"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={e => setPrimaryColor(e.target.value)}
                className="input flex-1 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={secondaryColor}
                onChange={e => setSecondaryColor(e.target.value)}
                className="w-10 h-10 rounded border border-gray-200 cursor-pointer"
              />
              <input
                type="text"
                value={secondaryColor}
                onChange={e => setSecondaryColor(e.target.value)}
                className="input flex-1 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-400 mb-2">Preview</p>
          <div className="flex items-center space-x-3">
            {logoPreview ? (
              <img src={logoPreview} alt="Preview" className="w-10 h-10 object-contain" />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: primaryColor }}
              >
                {team.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-bold" style={{ color: primaryColor }}>{team.name}</p>
              <p className="text-xs" style={{ color: secondaryColor }}>{team.school_name}</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary min-h-[44px]"
        >
          {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Branding'}
        </button>
      </div>
    </div>
  )
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function CollapsibleSection({
  title,
  count,
  sectionKey,
  expanded,
  onToggle,
  headerRight,
  children,
}: {
  title: string
  count: number
  sectionKey: string
  expanded: boolean
  onToggle: (key: string) => void
  headerRight?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => onToggle(sectionKey)}
          className="flex items-center gap-2 flex-1 min-w-0 text-left group"
        >
          <h2 className="text-lg font-semibold text-navy-900 truncate">
            {title}{' '}
            <span className="text-gray-400 font-normal">({count})</span>
          </h2>
          <ChevronIcon expanded={expanded} />
        </button>
        {headerRight}
      </div>
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: expanded ? '2000px' : '0', opacity: expanded ? 1 : 0 }}
      >
        {children}
      </div>
    </div>
  )
}

export default function Settings() {
  const { isCoach, isAdmin, profile: currentProfile } = useAuth()
  const { team, teamId, guestMode } = useTeam()
  const { seasons, loading: seasonsLoading, addSeason, updateSeason, deleteSeason, setActiveSeason, refetch: refetchSeasons } = useSeasons()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  // Season modal state
  const [showSeasonModal, setShowSeasonModal] = useState(false)
  const [editingSeason, setEditingSeason] = useState<Season | null>(null)
  const [confirmDeleteSeason, setConfirmDeleteSeason] = useState<string | null>(null)

  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [sectionsInitialized, setSectionsInitialized] = useState(false)

  const effectiveIsCoach = isCoach && !guestMode

  useEffect(() => {
    if (effectiveIsCoach) {
      fetchProfiles()
    } else {
      setLoading(false)
    }
  }, [effectiveIsCoach])

  // Initialize expanded state once profiles load
  useEffect(() => {
    if (!loading && !sectionsInitialized) {
      const pendingCount = profiles.filter(p => p.role === 'coach' && p.approved === false).length
      setExpandedSections({
        seasons: false,
        pending: pendingCount > 0,
        coaches: false,
        parents: false,
      })
      setSectionsInitialized(true)
    }
  }, [loading, profiles, sectionsInitialized])

  function toggleSection(key: string) {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function fetchProfiles() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('team_id', teamId)
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your team, user accounts, permissions, and seasons</p>
      </div>

      {/* ═══ Team Branding ═══ */}
      <TeamBrandingSection team={team} teamId={teamId} />

      {/* ═══ Season Management ═══ */}
      <CollapsibleSection
        title="Season Management"
        count={seasons.length}
        sectionKey="seasons"
        expanded={!!expandedSections.seasons}
        onToggle={toggleSection}
        headerRight={
          <button
            onClick={() => { setEditingSeason(null); setShowSeasonModal(true) }}
            className="btn-primary text-sm flex items-center space-x-1 min-h-[44px] shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>New Season</span>
          </button>
        }
      >
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
      </CollapsibleSection>

      {/* Season Modal */}
      {showSeasonModal && (
        <SeasonModal
          season={editingSeason}
          onSave={handleSaveSeason}
          onClose={() => { setShowSeasonModal(false); setEditingSeason(null) }}
        />
      )}

      {/* Pending Coach Requests */}
      <CollapsibleSection
        title="Pending Coach Requests"
        count={pendingCoachRequests.length}
        sectionKey="pending"
        expanded={!!expandedSections.pending}
        onToggle={toggleSection}
      >
        {pendingCoachRequests.length === 0 ? (
          <div className="card text-center py-6">
            <p className="text-gray-400">No pending requests</p>
          </div>
        ) : (
          <div className="card divide-y divide-gray-100">
            {pendingCoachRequests.map(p => (
              <div key={p.id} className="py-3 space-y-2">
                <div>
                  <p className="font-medium text-navy-900">
                    {p.full_name || 'Unnamed'}
                  </p>
                  <p className="text-sm text-gray-500 truncate">{p.email}</p>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => approveCoach(p.id)}
                      disabled={updatingId === p.id}
                      className="btn-primary text-sm px-3 py-1 min-h-[36px]"
                    >
                      {updatingId === p.id ? '...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => disapproveCoach(p.id)}
                      disabled={updatingId === p.id}
                      className="text-sm px-3 py-1 min-h-[36px] bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      {updatingId === p.id ? '...' : 'Disapprove'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* Coaches Section */}
      <CollapsibleSection
        title="Coaches"
        count={coaches.length}
        sectionKey="coaches"
        expanded={!!expandedSections.coaches}
        onToggle={toggleSection}
      >
        {coaches.length === 0 ? (
          <div className="card text-center py-6">
            <p className="text-gray-400">No coaches found</p>
          </div>
        ) : (
          <div className="card divide-y divide-gray-100">
            {coaches.map(coach => (
              <div key={coach.id} className="py-3 space-y-2">
                <div>
                  <p className="font-medium text-navy-900">
                    {coach.full_name || 'Unnamed'}
                  </p>
                  <p className="text-sm text-gray-500 truncate">{coach.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
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
      </CollapsibleSection>

      {/* Parents Section */}
      <CollapsibleSection
        title="Parents"
        count={parents.length}
        sectionKey="parents"
        expanded={!!expandedSections.parents}
        onToggle={toggleSection}
      >
        {parents.length === 0 ? (
          <div className="card text-center py-6">
            <p className="text-gray-400">No parent accounts</p>
          </div>
        ) : (
          <div className="card divide-y divide-gray-100">
            {parents.map(parent => (
              <div key={parent.id} className="py-3 space-y-2">
                <div>
                  <p className="font-medium text-navy-900">
                    {parent.full_name || 'Unnamed'}
                  </p>
                  <p className="text-sm text-gray-500 truncate">{parent.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
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
      </CollapsibleSection>
    </div>
  )
}
