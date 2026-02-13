/**
 * Results link helpers.
 *
 * Supports TFRRS (florida.tfrrs.org for HS, tfrrs.org for college),
 * plus any external results URL coaches want to add.
 */

const FL_TFRRS_BASE = 'https://florida.tfrrs.org'
const FL_TFRRS_SEARCH = `${FL_TFRRS_BASE}/results_search.html`

/**
 * Generate a Florida TFRRS search URL for an athlete.
 */
export function searchTFRRS(schoolName: string, athleteName: string): string {
  const query = `${athleteName} ${schoolName}`.trim()
  return `${FL_TFRRS_SEARCH}?search_query=${encodeURIComponent(query)}`
}

/**
 * Generate a Florida TFRRS search URL for meet results.
 */
export function searchTFRRSMeet(meetName: string, date?: string): string {
  let query = meetName.trim()
  if (date) {
    const year = new Date(date).getFullYear()
    if (year && !query.includes(String(year))) {
      query += ` ${year}`
    }
  }
  return `${FL_TFRRS_SEARCH}?search_query=${encodeURIComponent(query)}`
}

/**
 * Validate that a URL is a valid link (any URL, not just TFRRS).
 */
export function isValidResultsUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

// Keep old name for backward compat
export const isValidTFRRSUrl = isValidResultsUrl

/**
 * Extract a clean display label from a results URL.
 */
export function tfrrsDisplayLabel(url: string): string {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace('www.', '')
    if (host.includes('tfrrs.org')) {
      const path = parsed.pathname
      if (path.includes('/athletes/')) return 'TFRRS Profile'
      if (path.includes('/results/')) return 'TFRRS Results'
      return 'TFRRS'
    }
    if (host.includes('milesplit')) return 'MileSplit'
    if (host.includes('athletic.net')) return 'Athletic.net'
    if (host.includes('directathletics')) return 'Direct Athletics'
    // Generic: show domain name
    return host.split('.')[0].charAt(0).toUpperCase() + host.split('.')[0].slice(1)
  } catch {
    return 'Results'
  }
}
