import { useState, useEffect, useRef, useCallback } from 'react'

// Target: Feb 21, 2026 at 8:00 PM EST
const TARGET = new Date('2026-02-21T20:00:00-05:00').getTime()

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function getTimeLeft(): TimeLeft {
  const diff = Math.max(0, TARGET - Date.now())
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

/* ── Single Flip Card ── */
function FlipCard({ value, label }: { value: string; label: string }) {
  const [display, setDisplay] = useState(value)
  const [prev, setPrev] = useState(value)
  const [flipping, setFlipping] = useState(false)
  const firstRender = useRef(true)

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    if (value !== display) {
      setPrev(display)
      setFlipping(true)
      const t = setTimeout(() => {
        setDisplay(value)
        setFlipping(false)
      }, 300)
      return () => clearTimeout(t)
    }
  }, [value, display])

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[52px] h-[68px] sm:w-[72px] sm:h-[88px]" style={{ perspective: '200px' }}>
        {/* ── Top half: normal number ── */}
        <div className="absolute inset-x-0 top-0 h-1/2 overflow-hidden rounded-t-lg bg-navy-800 border border-navy-700">
          <div className="absolute inset-0 flex items-end justify-center pb-[1px]">
            <span className="text-2xl sm:text-4xl font-bold text-white font-mono tabular-nums">{display}</span>
          </div>
        </div>

        {/* ── Bottom half: mirrored/flipped number + blur ── */}
        <div className="absolute inset-x-0 top-1/2 h-1/2 overflow-hidden rounded-b-lg bg-navy-900 border border-navy-700 border-t-0">
          <div className="absolute inset-0 flex items-start justify-center pt-[1px]" style={{ transform: 'scaleY(-1)' }}>
            <span className="text-2xl sm:text-4xl font-bold text-gray-400 font-mono tabular-nums" style={{ filter: 'blur(0.8px)' }}>
              {flipping ? prev : display}
            </span>
          </div>
          {/* Gradient fade overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-navy-900/30 to-navy-900/80 pointer-events-none" />
        </div>

        {/* Center line / hinge */}
        <div className="absolute left-1 right-1 top-1/2 h-px bg-black/40 z-10" />
        <div className="absolute left-0 top-1/2 w-1.5 h-1.5 -mt-[3px] rounded-full bg-navy-600 z-10" />
        <div className="absolute right-0 top-1/2 w-1.5 h-1.5 -mt-[3px] rounded-full bg-navy-600 z-10" />

        {/* ── Flipping top card (falls forward, shows old value) ── */}
        {flipping && (
          <div
            className="absolute inset-x-0 top-0 h-1/2 overflow-hidden rounded-t-lg bg-navy-800 border border-navy-700 z-20"
            style={{
              animation: 'flipTop 0.3s ease-in forwards',
              transformOrigin: 'bottom center',
              backfaceVisibility: 'hidden',
            }}
          >
            <div className="absolute inset-0 flex items-end justify-center pb-[1px]">
              <span className="text-2xl sm:text-4xl font-bold text-white font-mono tabular-nums">{prev}</span>
            </div>
          </div>
        )}

        {/* ── Flipping bottom card (unfolds, shows new value mirrored) ── */}
        {flipping && (
          <div
            className="absolute inset-x-0 top-1/2 h-1/2 overflow-hidden rounded-b-lg bg-navy-900 border border-navy-700 border-t-0 z-20"
            style={{
              animation: 'flipBottom 0.3s 0.15s ease-out forwards',
              transformOrigin: 'top center',
              backfaceVisibility: 'hidden',
              transform: 'rotateX(90deg)',
            }}
          >
            <div className="absolute inset-0 flex items-start justify-center pt-[1px]" style={{ transform: 'scaleY(-1)' }}>
              <span className="text-2xl sm:text-4xl font-bold text-gray-400 font-mono tabular-nums" style={{ filter: 'blur(0.8px)' }}>
                {display}
              </span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-navy-900/30 to-navy-900/80 pointer-events-none" />
          </div>
        )}
      </div>
      <span className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-widest mt-2 font-medium">{label}</span>
    </div>
  )
}

/* ── Separator ── */
function Colon() {
  return (
    <div className="flex flex-col items-center justify-center h-[68px] sm:h-[88px] px-0.5 sm:px-1">
      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-brand-400 mb-2" />
      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-brand-400" />
    </div>
  )
}

/* ── Main Countdown ── */
export default function FlipCountdown() {
  const [time, setTime] = useState<TimeLeft>(getTimeLeft)
  const rafRef = useRef<number>()
  const lastSecond = useRef(-1)

  const tick = useCallback(() => {
    const now = getTimeLeft()
    const currentSecond = now.days * 86400 + now.hours * 3600 + now.minutes * 60 + now.seconds
    if (currentSecond !== lastSecond.current) {
      lastSecond.current = currentSecond
      setTime(now)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [tick])

  const expired = time.days === 0 && time.hours === 0 && time.minutes === 0 && time.seconds === 0

  if (expired) {
    return (
      <div className="text-center py-4">
        <p className="text-brand-400 font-bold text-lg">Offer Expired</p>
      </div>
    )
  }

  return (
    <div className="text-center">
      <p className="text-brand-400 font-semibold text-sm sm:text-base tracking-wide mb-4">
        COUNTDOWN TO DANNY BROWN
      </p>
      <div className="flex items-start justify-center gap-1 sm:gap-2">
        <FlipCard value={pad(time.days)} label="Days" />
        <Colon />
        <FlipCard value={pad(time.hours)} label="Hours" />
        <Colon />
        <FlipCard value={pad(time.minutes)} label="Min" />
        <Colon />
        <FlipCard value={pad(time.seconds)} label="Sec" />
      </div>
      <p className="text-gray-400 text-xs sm:text-sm mt-4">
        Create your team before time runs out for a <span className="text-white font-semibold">free season</span>
      </p>
    </div>
  )
}
