import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useEvents } from '../hooks/useEvents'
import { supabase } from '../lib/supabase'
import type { TrackEvent, TrackEventInsert } from '../types/database'

const CATEGORIES: TrackEvent['category'][] = ['Field', 'Sprint', 'Distance', 'Hurdles', 'Relay', 'Other']

const categoryColors: Record<string, string> = {
  Field: 'bg-green-100 text-green-800 border-green-200',
  Sprint: 'bg-blue-100 text-blue-800 border-blue-200',
  Distance: 'bg-purple-100 text-purple-800 border-purple-200',
  Hurdles: 'bg-orange-100 text-orange-800 border-orange-200',
  Relay: 'bg-pink-100 text-pink-800 border-pink-200',
  Other: 'bg-gray-100 text-gray-700 border-gray-200',
}

const emptyEvent: Omit<TrackEventInsert, 'id'> = {
  name: '',
  short_name: '',
  category: 'Sprint',
  max_entries: 99,
  is_relay: false,
}

export default function Events() {
  const { isCoach } = useAuth()
  const { events, loading, refetch, getEventsByCategory } = useEvents()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<TrackEvent | null>(null)
  const [form, setForm] = useState(emptyEvent)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filterCategory, setFilterCategory] = useState<string | null>(null)

  const openAdd = () => {
    setEditing(null)
    setForm(emptyEvent)
    setError('')
    setShowForm(true)
  }

  const openEdit = (event: TrackEvent) => {
    setEditing(event)
    setForm({
      name: event.name,
      short_name: event.short_name,
      category: event.category,
      max_entries: event.max_entries,
      is_relay: event.is_relay,
    })
    setError('')
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Event name is required')
      return
    }
    if (!form.short_name.trim()) {
      setError('Short name is required')
      return
    }

    setSaving(true)
    setError('')

    if (editing) {
      const { error: err } = await supabase
        .from('events')
        .update({
          name: form.name.trim(),
          short_name: form.short_name.trim(),
          category: form.category,
          max_entries: form.max_entries,
          is_relay: form.is_relay,
        } as Record<string, unknown>)
        .eq('id', editing.id)

      if (err) {
        setError(err.message)
      } else {
        setShowForm(false)
        refetch()
      }
    } else {
      const { error: err } = await supabase
        .from('events')
        .insert({
          name: form.name.trim(),
          short_name: form.short_name.trim(),
          category: form.category,
          max_entries: form.max_entries,
          is_relay: form.is_relay,
        } as Record<string, unknown>)

      if (err) {
        setError(err.message)
      } else {
        setShowForm(false)
        refetch()
      }
    }
    setSaving(false)
  }

  const handleDelete = async (event: TrackEvent) => {
    if (!confirm(`Delete "${event.name}"? This will also remove all meet entries for this event.`)) return

    const { error: err, count } = await supabase.from('events').delete({ count: 'exact' }).eq('id', event.id)
    if (err) {
      alert('Failed to delete event: ' + err.message)
    } else if (count === 0) {
      alert('Could not delete event — permission denied.')
    }
    refetch()
  }

  const grouped = getEventsByCategory()
  const displayCategories = filterCategory
    ? CATEGORIES.filter(c => c === filterCategory)
    : CATEGORIES

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-800" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">Events</h1>
          <p className="text-gray-500 mt-1">{events.length} events configured</p>
        </div>
        {isCoach && (
          <button onClick={openAdd} className="btn-primary">
            <svg className="w-4 h-4 mr-1.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Event
          </button>
        )}
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterCategory(null)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !filterCategory ? 'bg-navy-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterCategory === cat ? 'bg-navy-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat} ({grouped[cat]?.length || 0})
          </button>
        ))}
      </div>

      {/* Events by category */}
      {displayCategories.map(cat => {
        const catEvents = grouped[cat]
        if (!catEvents || catEvents.length === 0) return null

        return (
          <div key={cat}>
            <h2 className="text-lg font-semibold text-navy-800 mb-3">{cat}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {catEvents.map(event => (
                <div
                  key={event.id}
                  className={`rounded-xl border p-4 ${categoryColors[event.category] || categoryColors.Other}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{event.name}</h3>
                      <p className="text-sm opacity-75">{event.short_name}</p>
                    </div>
                    {isCoach && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(event)}
                          className="p-1.5 rounded-lg hover:bg-white/50 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(event)}
                          className="p-1.5 rounded-lg hover:bg-red-200/50 text-red-700 transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-sm opacity-75">
                    <span>Max: {event.max_entries}</span>
                    {event.is_relay && (
                      <span className="bg-white/50 px-1.5 py-0.5 rounded text-xs font-medium">Relay</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {events.length === 0 && (
        <div className="card text-center py-12 text-gray-500">
          <p className="text-lg font-medium">No events yet</p>
          {isCoach && <p className="text-sm mt-1">Add your first event to get started.</p>}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-navy-900">
              {editing ? 'Edit Event' : 'Add New Event'}
            </h2>

            {error && (
              <div className="p-3 bg-cardinal-50 border border-cardinal-200 rounded-lg text-cardinal-700 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="input"
                placeholder="e.g. 100 Meter Dash"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Short Name</label>
              <input
                type="text"
                value={form.short_name}
                onChange={e => setForm({ ...form, short_name: e.target.value })}
                className="input"
                placeholder="e.g. 100m"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value as TrackEvent['category'] })}
                className="input"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Entries</label>
              <input
                type="number"
                value={form.max_entries}
                onChange={e => setForm({ ...form, max_entries: parseInt(e.target.value) || 1 })}
                className="input"
                min={1}
              />
            </div>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={form.is_relay}
                onChange={e => setForm({ ...form, is_relay: e.target.checked })}
                className="rounded border-gray-300 text-navy-800 focus:ring-navy-500"
              />
              <span className="text-sm text-gray-700">This is a relay event</span>
            </label>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowForm(false)}
                className="btn-ghost flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex-1"
              >
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
