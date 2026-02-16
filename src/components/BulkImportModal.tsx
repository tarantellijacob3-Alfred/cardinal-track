import { useState, useMemo, useCallback, useRef } from 'react'
import type { AthleteInsert } from '../types/database'

interface ParsedRow {
  first_name: string
  last_name: string
  grade: number | null
  level: 'JV' | 'Varsity'
  gender: 'Boys' | 'Girls'
  error: string | null
}

interface Props {
  onImport: (athletes: Omit<AthleteInsert, 'team_id'>[]) => Promise<void>
  onClose: () => void
}

function detectAndParse(raw: string): ParsedRow[] {
  const lines = raw
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)

  if (lines.length === 0) return []

  // Skip header row if it looks like one
  const firstLower = lines[0].toLowerCase()
  const isHeader =
    firstLower.includes('first') ||
    firstLower.includes('last') ||
    firstLower.includes('name') ||
    firstLower.includes('grade')
  const dataLines = isHeader ? lines.slice(1) : lines

  return dataLines.map(line => {
    // Detect delimiter: tab, comma, or space-only (name per line)
    const hasTab = line.includes('\t')
    const hasComma = line.includes(',')

    let parts: string[]
    if (hasTab) {
      parts = line.split('\t').map(p => p.trim())
    } else if (hasComma) {
      parts = line.split(',').map(p => p.trim())
    } else {
      // Space-separated — assume "First Last" or just "FirstLast"
      parts = line.split(/\s+/)
    }

    const row: ParsedRow = {
      first_name: '',
      last_name: '',
      grade: null,
      level: 'JV',
      gender: 'Boys',
      error: null,
    }

    if (parts.length >= 5) {
      // Full format: First, Last, Grade, Level, Gender
      row.first_name = parts[0]
      row.last_name = parts[1]
      const gradeNum = parseInt(parts[2])
      row.grade = isNaN(gradeNum) ? null : gradeNum
      const levelRaw = parts[3].toLowerCase()
      row.level = levelRaw.startsWith('v') ? 'Varsity' : 'JV'
      const genderRaw = parts[4].toLowerCase()
      row.gender = genderRaw.startsWith('g') || genderRaw === 'f' || genderRaw === 'female' ? 'Girls' : 'Boys'
    } else if (parts.length === 4) {
      // First, Last, Grade, Level
      row.first_name = parts[0]
      row.last_name = parts[1]
      const gradeNum = parseInt(parts[2])
      row.grade = isNaN(gradeNum) ? null : gradeNum
      const levelRaw = parts[3].toLowerCase()
      row.level = levelRaw.startsWith('v') ? 'Varsity' : 'JV'
    } else if (parts.length === 3) {
      // First, Last, Grade OR First Last Grade
      row.first_name = parts[0]
      row.last_name = parts[1]
      const gradeNum = parseInt(parts[2])
      row.grade = isNaN(gradeNum) ? null : gradeNum
    } else if (parts.length === 2) {
      row.first_name = parts[0]
      row.last_name = parts[1]
    } else if (parts.length === 1) {
      row.first_name = parts[0]
      row.error = 'Only one name found — needs first and last name'
    }

    if (!row.first_name && !row.error) {
      row.error = 'Missing first name'
    }
    if (!row.last_name && !row.error) {
      row.error = 'Missing last name'
    }

    return row
  })
}

export default function BulkImportModal({ onImport, onClose }: Props) {
  const [rawText, setRawText] = useState('')
  const [importing, setImporting] = useState(false)
  const [defaultLevel, setDefaultLevel] = useState<'JV' | 'Varsity'>('JV')
  const [defaultGender, setDefaultGender] = useState<'Boys' | 'Girls'>('Boys')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parsed = useMemo(() => detectAndParse(rawText), [rawText])
  const validRows = useMemo(() => parsed.filter(r => !r.error), [parsed])
  const errorRows = useMemo(() => parsed.filter(r => r.error), [parsed])

  /** Handle CSV file upload */
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result
      if (typeof text === 'string') {
        setRawText(text)
      }
    }
    reader.readAsText(file)

    // Reset file input so same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleImport = useCallback(async () => {
    if (validRows.length === 0) return
    setImporting(true)
    try {
      const athletes: Omit<AthleteInsert, 'team_id'>[] = validRows.map(r => ({
        first_name: r.first_name,
        last_name: r.last_name,
        grade: r.grade,
        level: r.level || defaultLevel,
        gender: r.gender || defaultGender,
        active: true,
      }))
      await onImport(athletes)
      onClose()
    } finally {
      setImporting(false)
    }
  }, [validRows, defaultLevel, defaultGender, onImport, onClose])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold text-navy-900 text-lg">Import Athletes</h3>
            <p className="text-sm text-gray-500">
              Upload a CSV file or paste data below
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Default values */}
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Default Level</label>
              <div className="flex space-x-1">
                {(['JV', 'Varsity'] as const).map(l => (
                  <button
                    key={l}
                    onClick={() => setDefaultLevel(l)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors min-h-[44px] ${
                      defaultLevel === l
                        ? 'bg-navy-800 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Default Gender</label>
              <div className="flex space-x-1">
                {(['Boys', 'Girls'] as const).map(g => (
                  <button
                    key={g}
                    onClick={() => setDefaultGender(g)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors min-h-[44px] ${
                      defaultGender === g
                        ? 'bg-navy-800 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* CSV File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload CSV file</label>
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.tsv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-navy-400 hover:text-navy-700 transition-colors min-h-[44px]"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Choose .csv file
              </button>
              {rawText && (
                <span className="text-xs text-green-600 font-medium">
                  ✓ Data loaded ({parsed.length} rows)
                </span>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="text-xs text-gray-400 font-medium">OR</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Textarea */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Paste data</label>
            <textarea
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              rows={6}
              className="input font-mono text-sm"
              placeholder={`First, Last, Grade, Level, Gender\nJohn, Smith, 10, JV, Boys\nJane, Doe, 11, Varsity, Girls\n\nOr just:\nJohn Smith\nJane Doe`}
            />
          </div>

          {/* Format hint */}
          <div className="bg-navy-50 rounded-lg p-3 text-xs text-navy-700">
            <p className="font-medium mb-1">Accepted formats:</p>
            <ul className="list-disc list-inside space-y-0.5 text-navy-600">
              <li><code>First, Last, Grade, Level, Gender</code> (full)</li>
              <li><code>First, Last, Grade</code></li>
              <li><code>First Last</code> (one per line)</li>
              <li>Tab-separated also works</li>
              <li>Header row auto-detected and skipped</li>
            </ul>
          </div>

          {/* Preview */}
          {parsed.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-navy-900 mb-2">
                Preview ({validRows.length} valid, {errorRows.length} errors)
              </h4>

              {/* Mobile: card layout; Desktop: table */}
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b">
                      <th className="pb-1 pr-3">First</th>
                      <th className="pb-1 pr-3">Last</th>
                      <th className="pb-1 pr-3">Grade</th>
                      <th className="pb-1 pr-3">Level</th>
                      <th className="pb-1 pr-3">Gender</th>
                      <th className="pb-1">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parsed.map((row, i) => (
                      <tr key={i} className={row.error ? 'bg-red-50' : ''}>
                        <td className="py-1.5 pr-3 text-navy-800">{row.first_name || '—'}</td>
                        <td className="py-1.5 pr-3 text-navy-800">{row.last_name || '—'}</td>
                        <td className="py-1.5 pr-3 text-gray-600">{row.grade ?? '—'}</td>
                        <td className="py-1.5 pr-3">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            row.level === 'Varsity' ? 'bg-red-100 text-red-700' : 'bg-navy-100 text-navy-700'
                          }`}>
                            {row.level}
                          </span>
                        </td>
                        <td className="py-1.5 pr-3 text-gray-600">{row.gender}</td>
                        <td className="py-1.5">
                          {row.error ? (
                            <span className="text-xs text-red-600">{row.error}</span>
                          ) : (
                            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card layout */}
              <div className="sm:hidden space-y-2">
                {parsed.map((row, i) => (
                  <div key={i} className={`rounded-lg p-3 text-sm ${row.error ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-navy-800">
                        {row.first_name || '—'} {row.last_name || '—'}
                      </span>
                      {row.error ? (
                        <span className="text-xs text-red-600">⚠</span>
                      ) : (
                        <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {row.grade && <span className="text-xs text-gray-500">Gr {row.grade}</span>}
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        row.level === 'Varsity' ? 'bg-red-100 text-red-700' : 'bg-navy-100 text-navy-700'
                      }`}>{row.level}</span>
                      <span className="text-xs text-gray-500">{row.gender}</span>
                    </div>
                    {row.error && (
                      <p className="text-xs text-red-600 mt-1">{row.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="btn-ghost text-sm min-h-[44px]">Cancel</button>
          <button
            onClick={handleImport}
            disabled={validRows.length === 0 || importing}
            className="btn-primary text-sm flex items-center space-x-2 min-h-[44px]"
          >
            {importing ? (
              <>
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span>Importing...</span>
              </>
            ) : (
              <span>Import {validRows.length} Athletes</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
