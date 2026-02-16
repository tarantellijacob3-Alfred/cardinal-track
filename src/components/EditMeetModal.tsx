import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Meet } from '../types/database'

interface Props {
  meet: Meet
  onSaved: () => void
  onClose: () => void
}

export default function EditMeetModal({ meet, onSaved, onClose }: Props) {
  const [name, setName] = useState(meet.name)
  const [date, setDate] = useState(meet.date)
  const [location, setLocation] = useState(meet.location || '')
  const [level, setLevel] = useState<'JV' | 'Varsity' | 'Both'>(meet.level)
  const [notes, setNotes] = useState(meet.notes || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!name.trim() || !date) {
      setError('Name and date are required.')
      return
    }

    setSaving(true)
    setError('')

    const { error: updateError } = await supabase
      .from('meets')
      .update({
        name: name.trim(),
        date,
        location: location.trim() || null,
        level,
        notes: notes.trim() || null,
      })
      .eq('id', meet.id)

    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-navy-900 text-lg">Edit Meet</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-navy-900 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-navy-800 mb-1">Meet Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="input"
              placeholder="e.g. District Championship"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-800 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-800 mb-1">Location</label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="input"
              placeholder="e.g. Bolles School"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-800 mb-1">Level</label>
            <div className="flex gap-2">
              {(['JV', 'Varsity', 'Both'] as const).map(l => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLevel(l)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                    level === l
                      ? 'bg-brand-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-800 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="input min-h-[80px] resize-y"
              placeholder="Optional notes..."
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 btn-ghost min-h-[44px]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 btn-primary min-h-[44px]"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
