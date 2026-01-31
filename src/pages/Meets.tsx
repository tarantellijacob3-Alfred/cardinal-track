import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useMeets } from '../hooks/useMeets'
import MeetCard from '../components/MeetCard'

export default function Meets() {
  const { isCoach } = useAuth()
  const { meets, loading, addMeet, deleteMeet } = useMeets()
  const [showAddForm, setShowAddForm] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [location, setLocation] = useState('')
  const [level, setLevel] = useState<'JV' | 'Varsity' | 'Both'>('JV')
  const [notes, setNotes] = useState('')

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    await addMeet({
      name: name.trim(),
      date,
      location: location.trim() || null,
      level,
      notes: notes.trim() || null,
    })
    setName('')
    setDate('')
    setLocation('')
    setLevel('JV')
    setNotes('')
    setShowAddForm(false)
  }

  const handleDelete = async (meetId: string) => {
    if (confirm('Delete this meet and all its event assignments?')) {
      await deleteMeet(meetId)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Meets</h1>
          <p className="text-gray-500">{meets.length} total</p>
        </div>
        {isCoach && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>New Meet</span>
          </button>
        )}
      </div>

      {/* Add Form */}
      {showAddForm && isCoach && (
        <form onSubmit={handleAdd} className="card space-y-4">
          <h3 className="font-semibold text-navy-900">Create New Meet</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Meet Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="input"
                placeholder="e.g., BOYS JV Meet #2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="input"
                placeholder="e.g., Bishop Snyder HS"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
              <select
                value={level}
                onChange={e => setLevel(e.target.value as 'JV' | 'Varsity' | 'Both')}
                className="input"
              >
                <option value="JV">JV</option>
                <option value="Varsity">Varsity</option>
                <option value="Both">Both</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="input"
                rows={2}
                placeholder="Optional notes about this meet"
              />
            </div>
          </div>
          <div className="flex space-x-3">
            <button type="submit" className="btn-primary">Create Meet</button>
            <button type="button" onClick={() => setShowAddForm(false)} className="btn-ghost">Cancel</button>
          </div>
        </form>
      )}

      {/* Meets List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-800" />
        </div>
      ) : meets.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400">No meets yet</p>
          {isCoach && (
            <button onClick={() => setShowAddForm(true)} className="btn-primary mt-3 text-sm">
              Create your first meet
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {meets.map(meet => (
            <div key={meet.id} className="relative group">
              <MeetCard meet={meet} />
              {isCoach && (
                <button
                  onClick={(e) => { e.preventDefault(); handleDelete(meet.id) }}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-2 text-cardinal-500 hover:text-cardinal-700 hover:bg-cardinal-50 rounded-lg transition-all"
                  title="Delete meet"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
