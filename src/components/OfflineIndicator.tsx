import { useState, useEffect } from 'react'

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const goOffline = () => {
      setIsOffline(true)
      setShowBanner(true)
    }
    const goOnline = () => {
      setIsOffline(false)
      // Show "back online" briefly
      setTimeout(() => setShowBanner(false), 3000)
    }

    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)

    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  if (!showBanner) return null

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[60] text-center py-1.5 text-xs font-medium transition-colors ${
        isOffline
          ? 'bg-amber-500 text-amber-950'
          : 'bg-green-500 text-white'
      }`}
    >
      {isOffline ? (
        <>📡 You're offline — cached data may be shown</>
      ) : (
        <>✅ Back online</>
      )}
    </div>
  )
}
