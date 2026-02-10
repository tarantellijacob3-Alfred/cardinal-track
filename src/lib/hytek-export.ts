/**
 * Hy-Tek Semi-Colon Delimited Entry File Generator
 * 
 * Generates the industry-standard format accepted by:
 * - Hy-Tek Meet Manager
 * - MeetPro (DirectAthletics)
 * - Athletic.net
 * - MileSplit
 * - EasyMeet, RaceTab, LynxPad, RunnerCalc
 * 
 * Reference: https://hytek.active.com/User_Guides_HTML/TFMM5/importentriesfromsemicolon.htm
 */

import type { Athlete, TrackEvent, MeetEntryWithDetails } from '../types/database'

// ── Team config ──
interface TeamConfig {
  teamCode: string   // 4 char max, e.g. "BISH"
  teamName: string   // 30 char max, e.g. "Bishop Snyder"
}

const DEFAULT_TEAM: TeamConfig = {
  teamCode: 'BISH',
  teamName: 'Bishop Snyder',
}

// ── Event code mapping ──
// Maps our event short_name/name to Hy-Tek event codes
const EVENT_CODE_MAP: Record<string, string> = {
  // Sprint
  '100m': '100',
  '200m': '200',
  '400m': '400',
  '100': '100',
  '200': '200',
  '400': '400',
  // Distance
  '800m': '800',
  '1600m': '1600',
  '3200m': '3200',
  '800': '800',
  '1600': '1600',
  '3200': '3200',
  // Hurdles
  '100mH': '100H',
  '110mH': '110H',
  '300mH': '300H',
  '400mH': '400H',
  '80mH': '80H',
  '100H': '100H',
  '110H': '110H',
  '300H': '300H',
  '400H': '400H',
  // Field
  'HJ': 'HJ',
  'PV': 'PV',
  'LJ': 'LJ',
  'TJ': 'TJ',
  'SP': 'SP',
  'DT': 'DT',
  'JT': 'JT',
  'High Jump': 'HJ',
  'Pole Vault': 'PV',
  'Long Jump': 'LJ',
  'Triple Jump': 'TJ',
  'Shot Put': 'SP',
  'Discus': 'DT',
  'Javelin': 'JT',
  // Relays
  '4x100': '400',
  '4x400': '1600',
  '4x800': '3200',
  '4x100m': '400',
  '4x400m': '1600',
  '4x800m': '3200',
}

/**
 * Convert grade number to year abbreviation
 */
function gradeToYear(grade: number | null): string {
  if (!grade) return ''
  const map: Record<number, string> = {
    9: 'FR', 10: 'SO', 11: 'JR', 12: 'SR',
  }
  return map[grade] || String(grade)
}

/**
 * Resolve Hy-Tek event code from our event data
 */
function resolveEventCode(event: TrackEvent): string {
  // Try short_name first, then name
  return EVENT_CODE_MAP[event.short_name] 
    || EVENT_CODE_MAP[event.name] 
    || event.short_name 
    || event.name
}

/**
 * Map our gender format to Hy-Tek format
 */
function mapGender(gender: 'Boys' | 'Girls'): 'M' | 'F' {
  return gender === 'Boys' ? 'M' : 'F'
}

/**
 * Generate a D record (individual entry) line
 */
function generateDRecord(
  athlete: Athlete,
  event: TrackEvent,
  team: TeamConfig,
  seedMark?: string,
): string {
  const fields = [
    'D',
    athlete.last_name,
    athlete.first_name,
    '',                              // middle initial
    mapGender(athlete.gender),
    '',                              // DOB
    team.teamCode,
    team.teamName,
    '',                              // age
    gradeToYear(athlete.grade),
    resolveEventCode(event),
    seedMark || '',                  // entry mark (NT if blank)
    'E',                             // measure (English for US HS)
    '',                              // division
    '',                              // competitor number
    '',                              // finish place
    '',                              // declaration status
    '',                              // note
  ]
  return fields.join(';')
}

/**
 * Generate a Q record (relay entry) line
 */
function generateQRecord(
  event: TrackEvent,
  team: TeamConfig,
  relayLetter: string,
  gender: 'M' | 'F',
  runners: Athlete[],
  seedTime?: string,
): string {
  const headerFields = [
    'Q',
    team.teamCode,
    team.teamName,
    relayLetter,
    gender,
    '',                              // age
    resolveEventCode(event),
    seedTime || '',                  // entry time
    'E',                             // measure
    '',                              // division
    '',                              // finish place
    '',                              // declaration status
    '',                              // note
    '',                              // spare
    '',                              // spare
  ]

  // Add runner fields (up to 8)
  for (const runner of runners.slice(0, 8)) {
    headerFields.push(
      runner.last_name,
      runner.first_name,
      '',                            // initial
      mapGender(runner.gender),
      '',                            // DOB
      '',                            // age
      gradeToYear(runner.grade),
      '',                            // competitor number
    )
  }

  return headerFields.join(';')
}

export interface HyTekExportOptions {
  team?: TeamConfig
  /** Optional map of entry ID → seed mark string */
  seedMarks?: Record<string, string>
}

/**
 * Generate a complete Hy-Tek semi-colon delimited entry file
 * from meet entries with joined athlete/event data.
 */
export function generateHyTekEntryFile(
  entries: MeetEntryWithDetails[],
  options: HyTekExportOptions = {},
): string {
  const team = options.team || DEFAULT_TEAM
  const seedMarks = options.seedMarks || {}
  const lines: string[] = []

  // Separate individual and relay entries
  const individualEntries = entries.filter(e => !e.events?.is_relay)
  const relayEntries = entries.filter(e => e.events?.is_relay)

  // Generate D records for individual entries
  for (const entry of individualEntries) {
    if (!entry.athletes || !entry.events) continue
    lines.push(generateDRecord(
      entry.athletes,
      entry.events,
      team,
      seedMarks[entry.id],
    ))
  }

  // Group relay entries by event + relay_team
  const relayGroups = new Map<string, MeetEntryWithDetails[]>()
  for (const entry of relayEntries) {
    if (!entry.events) continue
    const key = `${entry.event_id}:${entry.relay_team || 'A'}`
    if (!relayGroups.has(key)) relayGroups.set(key, [])
    relayGroups.get(key)!.push(entry)
  }

  // Generate Q records for relay groups
  for (const [, groupEntries] of relayGroups) {
    const first = groupEntries[0]
    if (!first.events || !first.athletes) continue

    // Sort by relay_leg
    const sorted = [...groupEntries].sort(
      (a, b) => (a.relay_leg || 99) - (b.relay_leg || 99),
    )

    const runners = sorted
      .map(e => e.athletes)
      .filter((a): a is Athlete => !!a)

    const gender = runners[0] ? mapGender(runners[0].gender) : 'M'
    const relayLetter = first.relay_team === 'Alt' ? 'B' : 'A'

    lines.push(generateQRecord(
      first.events,
      team,
      relayLetter,
      gender,
      runners,
      seedMarks[`relay:${first.event_id}:${first.relay_team || 'A'}`],
    ))
  }

  // Hy-Tek spec: each record ends with CRLF
  return lines.join('\r\n') + '\r\n'
}

/**
 * Trigger a file download in the browser
 */
export function downloadHyTekFile(
  content: string,
  meetName: string,
): void {
  const sanitized = meetName.replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '_')
  const filename = `${sanitized}_entries.txt`

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
