import { useState, useEffect } from 'react'
import type { Season } from '../types/database'

interface SeasonModalProps {
  season?: Season | null  // null = creating new
  onSave: (data: { name: string; start_date: string; end_date: string | null; is_active: boolean }) => Promise<void>
  onClose: () => void
}

export default function SeasonModal({ season, onSave, onClose }: SeasonModalProps) {
  const [name, setName] = useState(season?.name || '')
  const [startDate, setStartDate] = useState(season?.start_date || '')
  const [endDate, setEndDate] = useState(season?.end_date || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (season) {
      setName(season.name)
      setStartDate(season.start_date)
      setEndDate(season.end_date || '')
    }
  }, [season])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await onSave({
      name: name.trim(),
      start_date: startDate,
      end_date: endDate || null,
      is_active: season?.is_active ?? false,
    })
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-navy-900">
            {season ? 'Edit Season' : 'New Season'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Season Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="input"
              placeholder="e.g., Spring 2026"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date (optional)</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="input"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || !name.trim() || !startDate}
              className="btn-primary flex-1 min-h-[44px]"
            >
              {saving ? 'Saving...' : season ? 'Save Changes' : 'Create Season'}
            </button>
            <button type="button" onClick={onClose} className="btn-ghost min-h-[44px]">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
