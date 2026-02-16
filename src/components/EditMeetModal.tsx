import { useState, useEffect } from 'react'
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
  const [notesFullscreen, setNotesFullscreen] = useState(false)

  // Lock body scroll on mobile when modal is open
  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = original }
  }, [])

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

  // Fullscreen notes editor
  if (notesFullscreen) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
          <button
            onClick={() => setNotesFullscreen(false)}
            className="text-brand-600 font-medium text-sm min-h-[44px] flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h3 className="font-semibold text-navy-900">Notes</h3>
          <button
            onClick={() => setNotesFullscreen(false)}
            className="text-brand-600 font-semibold text-sm min-h-[44px] flex items-center"
          >
            Done
          </button>
        </div>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="flex-1 p-4 text-base text-navy-900 placeholder-gray-400 resize-none focus:outline-none"
          placeholder="Meet notes..."
          autoFocus
        />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-md sm:mx-4 rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0">
          <h3 className="font-semibold text-navy-900 text-lg">Edit Meet</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-navy-900 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="px-5 py-4 space-y-5 overflow-y-auto flex-1 overscroll-contain">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-navy-800 mb-1.5">Meet Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="input text-base"
              placeholder="e.g. District Championship"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-800 mb-1.5">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="input text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-800 mb-1.5">Location</label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="input text-base"
              placeholder="e.g. Bolles School"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-800 mb-1.5">Level</label>
            <div className="flex gap-2">
              {(['JV', 'Varsity', 'Both'] as const).map(l => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLevel(l)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                    level === l
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-800 mb-1.5">Notes</label>
            <button
              type="button"
              onClick={() => setNotesFullscreen(true)}
              className="w-full text-left input text-base min-h-[80px] cursor-pointer hover:border-brand-300 transition-colors"
            >
              {notes ? (
                <span className="text-navy-900 line-clamp-3 whitespace-pre-wrap">{notes}</span>
              ) : (
                <span className="text-gray-400">Tap to edit notes...</span>
              )}
            </button>
          </div>
        </div>

        {/* Footer — sticky */}
        <div className="px-5 py-4 border-t flex gap-3 flex-shrink-0 pb-safe">
          <button
            onClick={onClose}
            className="flex-1 btn-ghost min-h-[48px] text-base"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 btn-primary min-h-[48px] text-base"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
