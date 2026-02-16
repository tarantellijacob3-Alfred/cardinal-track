import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Meet } from '../types/database'
import { useTeamPath } from '../hooks/useTeam'

interface Props {
  meet: Meet
  onDelete?: (id: string) => void
}

export default function MeetCard({ meet, onDelete }: Props) {
  const teamPath = useTeamPath()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const meetDate = new Date(meet.date + 'T00:00:00')
  const isUpcoming = meetDate >= new Date(new Date().toDateString())
  const isPast = !isUpcoming

  return (
    <div
      onClick={() => navigate(teamPath(`/meets/${meet.id}`))}
      className="card hover:shadow-md transition-shadow block cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-navy-900 text-lg">{meet.name}</h3>
          <div className="mt-1 space-y-1">
            <p className="text-sm text-gray-600 flex items-center">
              <svg className="w-4 h-4 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {meetDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
            {meet.location && (
              <p className="text-sm text-gray-600 flex items-center">
                <svg className="w-4 h-4 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {meet.location}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <span className={`badge ${meet.level === 'JV' ? 'bg-blue-100 text-blue-800' : meet.level === 'Varsity' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
            {meet.level}
          </span>
          {isPast && (
            <span className="text-xs text-gray-400">Completed</span>
          )}
          {isUpcoming && (
            <span className="text-xs text-green-600 font-medium">Upcoming</span>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(meet.id) }}
              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Delete meet"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
      {meet.notes && (
        <div className="mt-2 border-t pt-2">
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            Notes
          </button>
          {expanded && (
            <p className="text-sm text-gray-500 whitespace-pre-wrap mt-2">{meet.notes}</p>
          )}
        </div>
      )}
    </div>
  )
}
