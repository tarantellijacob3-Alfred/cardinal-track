import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) return

    // Check if dismissed recently (24h cooldown)
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed && Date.now() - parseInt(dismissed) < 24 * 60 * 60 * 1000) return

    // iOS detection
    const ua = navigator.userAgent
    const isiOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    setIsIOS(isiOS)

    if (isiOS) {
      // Show iOS instructions after a delay
      const timer = setTimeout(() => setShowPrompt(true), 3000)
      return () => clearTimeout(timer)
    }

    // Android/Chrome install prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setTimeout(() => setShowPrompt(true), 2000)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowPrompt(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 max-w-sm mx-auto">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-[#102a43] rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-yellow-400 font-bold text-sm">TB</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm">Add TrackBoard to Home Screen</p>
            <p className="text-gray-500 text-xs mt-0.5">
              Quick access at meets — works offline too!
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 p-1 -mt-1 -mr-1"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isIOS ? (
          <>
            {!showIOSInstructions ? (
              <button
                onClick={() => setShowIOSInstructions(true)}
                className="mt-3 w-full bg-[#102a43] text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-[#1a3a56] transition-colors"
              >
                Show me how
              </button>
            ) : (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-[10px]">1</span>
                  <span>Tap the <strong>Share</strong> button <span className="text-blue-500">⬆</span> in Safari</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-[10px]">2</span>
                  <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-[10px]">3</span>
                  <span>Tap <strong>"Add"</strong> — that's it!</span>
                </div>
              </div>
            )}
          </>
        ) : deferredPrompt ? (
          <button
            onClick={handleInstall}
            className="mt-3 w-full bg-[#102a43] text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-[#1a3a56] transition-colors"
          >
            Install App
          </button>
        ) : null}
      </div>
    </div>
  )
}
