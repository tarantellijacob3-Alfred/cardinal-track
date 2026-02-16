import { Link } from 'react-router-dom'
import type { Meet } from '../types/database'
import { useTeamPath } from '../hooks/useTeam'

interface Props {
  meet: Meet
}

export default function MeetCard({ meet }: Props) {
  const teamPath = useTeamPath()
  const meetDate = new Date(meet.date + 'T00:00:00')
  const isUpcoming = meetDate >= new Date(new Date().toDateString())
  const isPast = !isUpcoming

  return (
    <Link to={teamPath(`/meets/${meet.id}`)} className="card hover:shadow-md transition-shadow block">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-navy-900 text-lg">{meet.name}</h3>
          <div className="mt-1 space-y-1">
            <p className="text-sm text-gray-600 flex items-center">
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {meetDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
            {meet.location && (
              <p className="text-sm text-gray-600 flex items-center">
                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        </div>
      </div>
      {meet.notes && (
        <p className="mt-2 text-sm text-gray-500 border-t pt-2 line-clamp-2">{meet.notes}</p>
      )}
    </Link>
  )
}
