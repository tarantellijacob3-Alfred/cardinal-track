import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useAthletes } from '../hooks/useAthletes'
import { supabase } from '../lib/supabase'
import SearchBar from '../components/SearchBar'
import BulkImportModal from '../components/BulkImportModal'
import type { Athlete, AthleteInsert, MeetEntryWithDetails } from '../types/database'

type LevelFilter = 'all' | 'JV' | 'Varsity'
type GenderFilter = 'all' | 'Boys' | 'Girls'

/* ───── Inline Edit Cell ───── */
interface InlineEditProps {
  value: string
  onSave: (val: string) => void
  type?: 'text' | 'select'
  options?: string[]
  className?: string
}

function InlineEditCell({ value, onSave, type = 'text', options = [], className = '' }: InlineEditProps) {
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
        onClick={() => { setDraft(value); setEditing(true) }}
        className={`cursor-pointer hover:bg-navy-50 px-1 -mx-1 rounded transition-colors ${className}`}
        title="Click to edit"
      >
        {value}
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
      className="text-sm border border-navy-300 rounded px-1 py-0.5 w-20 focus:ring-1 focus:ring-navy-500 outline-none"
    />
  )
}

/* ───── Roster Page ───── */
export default function Roster() {
  const { isCoach } = useAuth()
  const { athletes, loading, addAthlete, bulkAddAthletes, updateAthlete, deleteAthlete } = useAthletes()
  const [allEntries, setAllEntries] = useState<MeetEntryWithDetails[]>([])
  const [entriesLoading, setEntriesLoading] = useState(true)

  useEffect(() => {
    async function fetchAllEntries() {
      setEntriesLoading(true)
      const { data } = await supabase
        .from('meet_entries')
        .select(`*, athletes (*), events (*)`)
      if (data) setAllEntries(data as unknown as MeetEntryWithDetails[])
      setEntriesLoading(false)
    }
    fetchAllEntries()
  }, [])

  // Group entries by athlete id
  const entriesByAthlete = useMemo(() => {
    const map = new Map<string, MeetEntryWithDetails[]>()
    for (const entry of allEntries) {
      const list = map.get(entry.athlete_id) || []
      list.push(entry)
      map.set(entry.athlete_id, list)
    }
    return map
  }, [allEntries])

  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all')
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)

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

  const handleBulkImport = async (newAthletes: AthleteInsert[]) => {
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
              className="btn-secondary flex items-center space-x-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>Import Athletes</span>
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn-primary flex items-center space-x-2 text-sm"
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
            <button type="submit" className="btn-primary">Add Athlete</button>
            <button type="button" onClick={() => setShowAddForm(false)} className="btn-ghost">Cancel</button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={search} onChange={setSearch} className="flex-1" />
        <div className="flex flex-wrap gap-2">
          {/* Level filter pills */}
          <div className="flex space-x-1">
            {(['all', 'JV', 'Varsity'] as const).map(level => (
              <button
                key={level}
                onClick={() => setLevelFilter(level)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  levelFilter === level
                    ? 'bg-navy-800 text-white'
                    : 'bg-white text-gray-600 border hover:bg-gray-50'
                }`}
              >
                {level === 'all' ? 'All' : level}
                <span className="ml-1 text-xs opacity-70">
                  {level === 'all' ? counts.all : counts[level]}
                </span>
              </button>
            ))}
          </div>
          {/* Gender filter pills */}
          <div className="flex space-x-1">
            {(['all', 'Boys', 'Girls'] as const).map(gender => (
              <button
                key={gender}
                onClick={() => setGenderFilter(gender)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
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
                  <span className="ml-1 text-xs opacity-70">{counts[gender]}</span>
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
          {filteredAthletes.map(athlete => {
            const athleteEntries = entriesByAthlete.get(athlete.id) || []
            // Deduplicate events by event name (athlete could be in same event across meets)
            const uniqueEvents = new Map<string, { name: string; shortName: string; category: string; isRelay: boolean }>()
            athleteEntries.forEach(e => {
              if (e.events && !uniqueEvents.has(e.events.id)) {
                uniqueEvents.set(e.events.id, {
                  name: e.events.name,
                  shortName: e.events.short_name,
                  category: e.events.category,
                  isRelay: e.events.is_relay,
                })
              }
            })
            const events = Array.from(uniqueEvents.values()).sort((a, b) => a.name.localeCompare(b.name))

            const categoryColor: Record<string, string> = {
              Field: 'bg-green-100 text-green-800',
              Sprint: 'bg-blue-100 text-blue-800',
              Distance: 'bg-purple-100 text-purple-800',
              Hurdles: 'bg-orange-100 text-orange-800',
              Relay: 'bg-yellow-100 text-yellow-800',
              Other: 'bg-gray-100 text-gray-700',
            }

            return (
              <div key={athlete.id} className="card">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  {/* Left: avatar + name + meta */}
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-navy-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-navy-700">
                        {athlete.first_name[0]}{athlete.last_name[0]}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-1">
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
                          <Link to={`/athletes/${athlete.id}`} className="font-semibold text-navy-900 hover:text-navy-700">
                            {athlete.last_name}, {athlete.first_name}
                          </Link>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {athlete.grade && (
                          <span className="text-xs text-gray-500">Grade {athlete.grade}</span>
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

                  {/* Right: coach actions */}
                  {isCoach && (
                    <div className="flex items-center space-x-1 pl-13 sm:pl-0">
                      <button
                        onClick={() => handlePromoteDemote(athlete)}
                        className={`px-2 py-1 text-xs font-medium rounded-lg transition-colors ${
                          athlete.level === 'JV'
                            ? 'text-cardinal-700 hover:bg-cardinal-50 border border-cardinal-200'
                            : 'text-navy-700 hover:bg-navy-50 border border-navy-200'
                        }`}
                        title={athlete.level === 'JV' ? 'Promote to Varsity' : 'Move to JV'}
                      >
                        {athlete.level === 'JV' ? '↑ Varsity' : '↓ JV'}
                      </button>
                      <button
                        onClick={() => handleDeactivate(athlete.id)}
                        className="p-1.5 text-gray-400 hover:text-cardinal-600 rounded-lg hover:bg-cardinal-50 transition-colors"
                        title="Deactivate"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handlePermanentDelete(athlete.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete permanently"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Events row */}
                {!entriesLoading && events.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {events.map((ev, idx) => (
                      <span
                        key={idx}
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${categoryColor[ev.category] || categoryColor.Other}`}
                      >
                        {ev.shortName || ev.name}
                        {ev.isRelay && ' 🏃‍♂️'}
                      </span>
                    ))}
                  </div>
                )}
                {!entriesLoading && events.length === 0 && (
                  <p className="mt-2 text-xs text-gray-400 italic">No events registered</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Bulk Import Modal */}
      {showImportModal && (
        <BulkImportModal
          onImport={handleBulkImport}
          onClose={() => setShowImportModal(false)}
        />
      )}
    </div>
  )
}
