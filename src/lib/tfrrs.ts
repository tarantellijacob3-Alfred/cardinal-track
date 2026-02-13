/**
 * TFRRS (Track & Field Results Reporting System) integration helpers.
 *
 * TFRRS doesn't have a public API, so we generate search URLs that
 * coaches can use to manually find and link profiles/results.
 *
 * Future: If TFRRS adds an API or we get permission to scrape,
 * this module can be extended with actual data fetching.
 */

const TFRRS_BASE = 'https://www.tfrrs.org'
const TFRRS_SEARCH = `${TFRRS_BASE}/results_search.html`

/**
 * Generate a TFRRS search URL for an athlete profile.
 * Coach can click this to find the right TFRRS profile and copy the URL.
 */
export function searchTFRRS(schoolName: string, athleteName: string): string {
  const query = `${athleteName} ${schoolName}`.trim()
  return `${TFRRS_SEARCH}?search_query=${encodeURIComponent(query)}`
}

/**
 * Generate a TFRRS search URL for meet results.
 * Searches by meet name and optional date for more specific results.
 */
export function searchTFRRSMeet(meetName: string, date?: string): string {
  let query = meetName.trim()
  if (date) {
    // Add year from date for better search results
    const year = new Date(date).getFullYear()
    if (year && !query.includes(String(year))) {
      query += ` ${year}`
    }
  }
  return `${TFRRS_SEARCH}?search_query=${encodeURIComponent(query)}`
}

/**
 * Validate that a URL looks like a TFRRS profile or results URL.
 */
export function isValidTFRRSUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.hostname === 'www.tfrrs.org' || parsed.hostname === 'tfrrs.org'
  } catch {
    return false
  }
}

/**
 * Extract a clean display label from a TFRRS URL.
 */
export function tfrrsDisplayLabel(url: string): string {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname
    if (path.includes('/athletes/')) return 'TFRRS Profile'
    if (path.includes('/results/')) return 'TFRRS Results'
    return 'TFRRS'
  } catch {
    return 'TFRRS'
  }
}
