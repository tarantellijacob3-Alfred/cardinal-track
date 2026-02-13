import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useAthletes } from '../hooks/useAthletes'
import { useTeamPath } from '../hooks/useTeam'
import SearchBar from '../components/SearchBar'
import BulkImportModal from '../components/BulkImportModal'
import type { Athlete, AthleteInsert } from '../types/database'

type LevelFilter = 'all' | 'JV' | 'Varsity'
type GenderFilter = 'all' | 'Boys' | 'Girls'

/* ───── Inline Edit Cell ───── */
interface InlineEditProps {
  value: string
  onSave: (val: string) => void
  type?: 'text' | 'select'
  options?: string[]
  className?: string
  displayValue?: string
  editValue?: string
}

function InlineEditCell({ value, onSave, type = 'text', options = [], className = '', displayValue, editValue }: InlineEditProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      if (type === 'text' && inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select()
      }
    }
  }, [editing, type])

  const commit = useCallback(() => {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== value) {
      onSave(trimmed)
    }
    setEditing(false)
  }, [draft, value, onSave])

  const cancel = useCallback(() => {
    setDraft(value)
    setEditing(false)
  }, [value])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commit()
    else if (e.key === 'Escape') cancel()
  }, [commit, cancel])

  if (!editing) {
    return (
      <span
        onClick={() => { setDraft(editValue ?? value); setEditing(true) }}
        className={`cursor-pointer hover:bg-navy-50 px-1 -mx-1 rounded transition-colors ${className}`}
        title="Click to edit"
      >
        {displayValue ?? value}
      </span>
    )
  }

  if (type === 'select') {
    return (
      <select
        ref={inputRef as React.RefObject<HTMLSelectElement>}
        value={draft}
        onChange={e => { setDraft(e.target.value); onSave(e.target.value); setEditing(false) }}
        onBlur={() => setEditing(false)}
        onKeyDown={handleKeyDown}
        className="text-sm border border-navy-300 rounded px-1 py-0.5 focus:ring-1 focus:ring-navy-500 outline-none"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    )
  }

  return (
    <input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      className="text-sm border border-navy-300 rounded px-1 py-0.5 min-w-0 max-w-24 focus:ring-1 focus:ring-navy-500 outline-none"
      style={{ width: `${Math.max(draft.length * 8 + 16, 60)}px` }}
    />
  )
}

/* ───── Roster Page ───── */
export default function Roster() {
  const { isCoach } = useAuth()
  const { athletes, loading, addAthlete, bulkAddAthletes, updateAthlete, deleteAthlete } = useAthletes()
  const teamPath = useTeamPath()
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all')
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [settingsAthlete, setSettingsAthlete] = useState<Athlete | null>(null)

  // Add form state
  const [newFirstName, setNewFirstName] = useState('')
  const [newLastName, setNewLastName] = useState('')
  const [newGrade, setNewGrade] = useState('')
  const [newLevel, setNewLevel] = useState<'JV' | 'Varsity'>('JV')
  const [newGender, setNewGender] = useState<'Boys' | 'Girls'>('Boys')

  const filteredAthletes = useMemo(() => {
    return athletes.filter(a => {
      if (!a.active) return false
      if (levelFilter !== 'all' && a.level !== levelFilter) return false
      if (genderFilter !== 'all' && a.gender !== genderFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          a.first_name.toLowerCase().includes(q) ||
          a.last_name.toLowerCase().includes(q) ||
          `${a.last_name} ${a.first_name}`.toLowerCase().includes(q) ||
          `${a.first_name} ${a.last_name}`.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [athletes, search, levelFilter, genderFilter])

  // Counts for filter badges
  const counts = useMemo(() => {
    const active = athletes.filter(a => a.active)
    return {
      all: active.length,
      JV: active.filter(a => a.level === 'JV').length,
      Varsity: active.filter(a => a.level === 'Varsity').length,
      Boys: active.filter(a => a.gender === 'Boys').length,
      Girls: active.filter(a => a.gender === 'Girls').length,
    }
  }, [athletes])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    await addAthlete({
      first_name: newFirstName.trim(),
      last_name: newLastName.trim(),
      grade: newGrade ? parseInt(newGrade) : null,
      level: newLevel,
      gender: newGender,
      active: true,
    })
    setNewFirstName('')
    setNewLastName('')
    setNewGrade('')
    setShowAddForm(false)
  }

  const handleDeactivate = async (id: string) => {
    if (confirm('Remove this athlete from the roster?')) {
      await updateAthlete(id, { active: false })
    }
  }

  const handlePermanentDelete = async (id: string) => {
    if (confirm('Permanently delete this athlete? This cannot be undone.')) {
      await deleteAthlete(id)
    }
  }

  const handlePromoteDemote = async (athlete: Athlete) => {
    const newLevel = athlete.level === 'JV' ? 'Varsity' : 'JV'
    await updateAthlete(athlete.id, { level: newLevel })
  }

  const handleInlineUpdate = async (id: string, field: keyof Athlete, value: string) => {
    if (field === 'grade') {
      const num = parseInt(value)
      await updateAthlete(id, { grade: isNaN(num) ? null : num })
    } else if (field === 'level') {
      await updateAthlete(id, { level: value as 'JV' | 'Varsity' })
    } else if (field === 'gender') {
      await updateAthlete(id, { gender: value as 'Boys' | 'Girls' })
    } else if (field === 'first_name' || field === 'last_name') {
      await updateAthlete(id, { [field]: value })
    }
  }

  const handleBulkImport = async (newAthletes: Omit<AthleteInsert, 'team_id'>[]) => {
    await bulkAddAthletes(newAthletes)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Roster</h1>
          <p className="text-gray-500">{filteredAthletes.length} athletes</p>
        </div>
        {isCoach && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="btn-secondary flex items-center space-x-2 text-sm min-h-[44px]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>Import Athletes</span>
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn-primary flex items-center space-x-2 text-sm min-h-[44px]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Athlete</span>
            </button>
          </div>
        )}
      </div>

      {/* Add Form */}
      {showAddForm && isCoach && (
        <form onSubmit={handleAdd} className="card space-y-4">
          <h3 className="font-semibold text-navy-900">Add New Athlete</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                value={newFirstName}
                onChange={e => setNewFirstName(e.target.value)}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={newLastName}
                onChange={e => setNewLastName(e.target.value)}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
              <input
                type="number"
                value={newGrade}
                onChange={e => setNewGrade(e.target.value)}
                className="input"
                min="9"
                max="12"
                placeholder="9-12"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
              <select
                value={newLevel}
                onChange={e => setNewLevel(e.target.value as 'JV' | 'Varsity')}
                className="input"
              >
                <option value="JV">JV</option>
                <option value="Varsity">Varsity</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                value={newGender}
                onChange={e => setNewGender(e.target.value as 'Boys' | 'Girls')}
                className="input"
              >
                <option value="Boys">Boys</option>
                <option value="Girls">Girls</option>
              </select>
            </div>
          </div>
          <div className="flex space-x-3">
            <button type="submit" className="btn-primary min-h-[44px]">Add Athlete</button>
            <button type="button" onClick={() => setShowAddForm(false)} className="btn-ghost min-h-[44px]">Cancel</button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="space-y-3">
        <SearchBar value={search} onChange={setSearch} />
        
        {/* Filter Pills - Stack on mobile, side by side on larger screens */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Level filter pills */}
          <div className="flex flex-wrap gap-1">
            <span className="text-xs font-medium text-gray-500 self-center mr-2">Level:</span>
            {(['all', 'JV', 'Varsity'] as const).map(level => (
              <button
                key={level}
                onClick={() => setLevelFilter(level)}
                className={`px-3 py-2 rounded-md text-xs font-medium transition-colors min-h-[44px] ${
                  levelFilter === level
                    ? 'bg-navy-800 text-white'
                    : 'bg-white text-gray-600 border hover:bg-gray-50'
                }`}
              >
                {level === 'all' ? 'All' : level}
                <span className="ml-1 opacity-70">
                  ({level === 'all' ? counts.all : counts[level]})
                </span>
              </button>
            ))}
          </div>
          
          {/* Gender filter pills */}
          <div className="flex flex-wrap gap-1">
            <span className="text-xs font-medium text-gray-500 self-center mr-2">Gender:</span>
            {(['all', 'Boys', 'Girls'] as const).map(gender => (
              <button
                key={gender}
                onClick={() => setGenderFilter(gender)}
                className={`px-3 py-2 rounded-md text-xs font-medium transition-colors min-h-[44px] ${
                  genderFilter === gender
                    ? gender === 'Boys'
                      ? 'bg-blue-600 text-white'
                      : gender === 'Girls'
                      ? 'bg-pink-600 text-white'
                      : 'bg-navy-800 text-white'
                    : 'bg-white text-gray-600 border hover:bg-gray-50'
                }`}
              >
                {gender === 'all' ? 'All' : gender}
                {gender !== 'all' && (
                  <span className="ml-1 opacity-70">({counts[gender]})</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Athletes List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-800" />
        </div>
      ) : filteredAthletes.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400">No athletes found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAthletes.map(athlete => (
              <div key={athlete.id} className="card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="flex-shrink-0 w-10 h-10 bg-navy-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-navy-700">
                        {athlete.first_name[0]}{athlete.last_name[0]}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1 flex-wrap">
                        {isCoach ? (
                          <>
                            <InlineEditCell
                              value={athlete.last_name}
                              onSave={val => handleInlineUpdate(athlete.id, 'last_name', val)}
                              className="font-semibold text-navy-900"
                            />
                            <span className="text-gray-400">,</span>
                            <InlineEditCell
                              value={athlete.first_name}
                              onSave={val => handleInlineUpdate(athlete.id, 'first_name', val)}
                              className="text-navy-800"
                            />
                          </>
                        ) : (
                          <Link to={teamPath(`/athletes/${athlete.id}`)} className="font-semibold text-navy-900 hover:text-navy-700 truncate">
                            {athlete.last_name}, {athlete.first_name}
                          </Link>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {isCoach ? (
                          <span className="text-xs text-gray-500">
                            Grade{' '}
                            <InlineEditCell
                              value={athlete.grade ? String(athlete.grade) : ''}
                              displayValue={athlete.grade ? String(athlete.grade) : '—'}
                              editValue={athlete.grade ? String(athlete.grade) : ''}
                              onSave={val => handleInlineUpdate(athlete.id, 'grade', val)}
                              className="text-xs text-gray-500"
                            />
                          </span>
                        ) : (
                          athlete.grade && (
                            <span className="text-xs text-gray-500">Grade {athlete.grade}</span>
                          )
                        )}
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                          athlete.level === 'Varsity'
                            ? 'bg-cardinal-100 text-cardinal-700'
                            : 'bg-navy-100 text-navy-700'
                        }`}>
                          {athlete.level}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                          athlete.gender === 'Boys'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-pink-100 text-pink-700'
                        }`}>
                          {athlete.gender}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isCoach && (
                    <div className="flex items-center flex-shrink-0">
                      <button
                        onClick={() => setSettingsAthlete(athlete)}
                        className="p-2 text-gray-400 hover:text-navy-700 rounded-lg hover:bg-navy-50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Settings"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.9.548 2.061.079 2.573-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
          ))}
        </div>
      )}

      {/* Bulk Import Modal */}
      {showImportModal && (
        <BulkImportModal
          onImport={handleBulkImport}
          onClose={() => setShowImportModal(false)}
        />
      )}

      {/* Athlete Settings Modal */}
      {settingsAthlete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSettingsAthlete(null)}
          />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-lg p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-navy-900">Athlete Settings</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {settingsAthlete.last_name}, {settingsAthlete.first_name}
                </p>
              </div>
              <button
                onClick={() => setSettingsAthlete(null)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Close"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-2">
              <button
                onClick={async () => {
                  await handlePromoteDemote(settingsAthlete)
                  setSettingsAthlete(null)
                }}
                className={`w-full px-3 py-3 rounded-lg text-sm font-medium border transition-colors min-h-[44px] ${
                  settingsAthlete.level === 'JV'
                    ? 'text-cardinal-700 hover:bg-cardinal-50 border-cardinal-200'
                    : 'text-navy-700 hover:bg-navy-50 border-navy-200'
                }`}
              >
                {settingsAthlete.level === 'JV' ? 'Promote to Varsity' : 'Move to JV'}
              </button>

              <button
                onClick={async () => {
                  await handleDeactivate(settingsAthlete.id)
                  setSettingsAthlete(null)
                }}
                className="w-full px-3 py-3 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 min-h-[44px]"
              >
                Deactivate
              </button>

              <button
                onClick={async () => {
                  await handlePermanentDelete(settingsAthlete.id)
                  setSettingsAthlete(null)
                }}
                className="w-full px-3 py-3 rounded-lg text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 min-h-[44px]"
              >
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
