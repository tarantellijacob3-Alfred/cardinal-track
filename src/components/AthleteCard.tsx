import { Link } from 'react-router-dom'
import type { Athlete } from '../types/database'

interface Props {
  athlete: Athlete
  eventCount?: number
  compact?: boolean
  onClick?: () => void
}

export default function AthleteCard({ athlete, eventCount, compact = false, onClick }: Props) {
  const content = (
    <div className={`flex items-center justify-between ${compact ? 'py-1' : 'py-2'}`}>
      <div className="flex items-center space-x-3">
        <div className={`flex-shrink-0 ${compact ? 'w-8 h-8' : 'w-10 h-10'} bg-navy-100 rounded-full flex items-center justify-center`}>
          <span className={`font-medium text-navy-700 ${compact ? 'text-xs' : 'text-sm'}`}>
            {athlete.first_name[0]}{athlete.last_name[0]}
          </span>
        </div>
        <div>
          <p className={`font-medium text-navy-900 ${compact ? 'text-sm' : ''}`}>
            {athlete.last_name}, {athlete.first_name}
          </p>
          {!compact && (
            <p className="text-xs text-gray-500">
              {athlete.level} {athlete.gender}
              {athlete.grade ? ` · Grade ${athlete.grade}` : ''}
            </p>
          )}
        </div>
      </div>
      {eventCount !== undefined && (
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          eventCount >= 4
            ? 'bg-cardinal-100 text-cardinal-700'
            : eventCount >= 3
            ? 'bg-gold-100 text-gold-700'
            : 'bg-green-100 text-green-700'
        }`}>
          {eventCount}/4
        </span>
      )}
    </div>
  )

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left hover:bg-gray-50 px-3 rounded-lg transition-colors">
        {content}
      </button>
    )
  }

  return (
    <Link to={`/athletes/${athlete.id}`} className="block hover:bg-gray-50 px-3 rounded-lg transition-colors">
      {content}
    </Link>
  )
}
