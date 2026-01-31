import { useState, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useAthletes } from '../hooks/useAthletes'
import AthleteCard from '../components/AthleteCard'
import SearchBar from '../components/SearchBar'

export default function Roster() {
  const { isCoach } = useAuth()
  const { athletes, loading, addAthlete, updateAthlete, deleteAthlete } = useAthletes()
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

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
  }, [athletes, search, levelFilter])

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

  const handleDelete = async (id: string) => {
    if (confirm('Remove this athlete from the roster?')) {
      await updateAthlete(id, { active: false })
    }
  }

  const handlePermanentDelete = async (id: string) => {
    if (confirm('Permanently delete this athlete? This cannot be undone.')) {
      await deleteAthlete(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Roster</h1>
          <p className="text-gray-500">{filteredAthletes.length} athletes</p>
        </div>
        {isCoach && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Athlete</span>
          </button>
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
        <div className="flex space-x-2">
          {['all', 'JV', 'Varsity'].map(level => (
            <button
              key={level}
              onClick={() => setLevelFilter(level)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                levelFilter === level
                  ? 'bg-navy-800 text-white'
                  : 'bg-white text-gray-600 border hover:bg-gray-50'
              }`}
            >
              {level === 'all' ? 'All' : level}
            </button>
          ))}
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
        <div className="card divide-y divide-gray-100">
          {filteredAthletes.map(athlete => (
            <div key={athlete.id} className="flex items-center justify-between">
              <div className="flex-1">
                <AthleteCard athlete={athlete} />
              </div>
              {isCoach && (
                <div className="flex items-center space-x-1 pr-3">
                  <button
                    onClick={() => handleDelete(athlete.id)}
                    className="p-2 text-gray-400 hover:text-cardinal-600 rounded-lg hover:bg-cardinal-50 transition-colors"
                    title="Deactivate"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
