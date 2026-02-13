import { useTeam } from '../hooks/useTeam'

/**
 * Small dropdown to switch between seasons.
 * Shows on Dashboard, Meets, Roster, AthleteDetail.
 */
export default function SeasonSelector() {
  const { seasons, seasonsLoading, selectedSeasonId, setSelectedSeasonId } = useTeam()

  if (seasonsLoading || seasons.length === 0) return null

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs font-medium text-gray-500 whitespace-nowrap">Season:</label>
      <select
        value={selectedSeasonId || ''}
        onChange={e => setSelectedSeasonId(e.target.value || null)}
        className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white text-navy-800 font-medium focus:ring-1 focus:ring-navy-500 focus:border-navy-500 outline-none min-h-[36px]"
      >
        <option value="">All Seasons</option>
        {seasons.map(s => (
          <option key={s.id} value={s.id}>
            {s.name}{s.is_active ? ' ✦' : ''}
          </option>
        ))}
      </select>
    </div>
  )
}
