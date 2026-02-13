import { tfrrsDisplayLabel } from '../lib/tfrrs'

interface TFRRSLinkProps {
  url: string
  className?: string
  /** Show as a small badge or a button-style link */
  variant?: 'badge' | 'button'
}

/**
 * Small badge/button that links out to a TFRRS page.
 * Used on athlete profiles and meet reports.
 */
export default function TFRRSLink({ url, className = '', variant = 'badge' }: TFRRSLinkProps) {
  const label = tfrrsDisplayLabel(url)

  if (variant === 'button') {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors min-h-[36px] ${className}`}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
        <span>{label}</span>
      </a>
    )
  }

  // Badge variant (inline)
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium hover:bg-blue-200 transition-colors ${className}`}
      title={`View on TFRRS: ${url}`}
    >
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
      <span>TFRRS</span>
    </a>
  )
}
