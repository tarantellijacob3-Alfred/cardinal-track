import { useRef, useCallback, useEffect, useState } from 'react'

interface UseLongPressDragOptions {
  onDragStart?: (item: unknown, position: { x: number; y: number }) => void
  onDragMove?: (position: { x: number; y: number }) => void
  onDragEnd?: (result: { targetEventId: string } | null) => void
  longPressDelay?: number
  disabled?: boolean
  getDropResult?: () => { targetEventId: string } | null
}

export function useLongPressDrag<T>(
  item: T,
  options: UseLongPressDragOptions = {}
) {
  const {
    onDragStart,
    onDragMove,
    onDragEnd,
    longPressDelay = 700,
    disabled = false,
    getDropResult,
  } = options

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isDraggingRef = useRef(false)
  const startPosRef = useRef<{ x: number; y: number } | null>(null)
  const [isLongPressing, setIsLongPressing] = useState(false)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Global touchmove handler to prevent scroll during drag
  useEffect(() => {
    if (!isDraggingRef.current) return

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (isDraggingRef.current) {
        e.preventDefault()
        const touch = e.touches[0]
        onDragMove?.({ x: touch.clientX, y: touch.clientY })
      }
    }

    const handleGlobalTouchEnd = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false
        setIsLongPressing(false)
        const result = getDropResult?.() || null
        onDragEnd?.(result)
      }
      startPosRef.current = null
    }

    // Use passive: false to allow preventDefault
    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false })
    document.addEventListener('touchend', handleGlobalTouchEnd)
    document.addEventListener('touchcancel', handleGlobalTouchEnd)

    return () => {
      document.removeEventListener('touchmove', handleGlobalTouchMove)
      document.removeEventListener('touchend', handleGlobalTouchEnd)
      document.removeEventListener('touchcancel', handleGlobalTouchEnd)
    }
  }, [isLongPressing, onDragMove, onDragEnd])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return
    
    const touch = e.touches[0]
    const pos = { x: touch.clientX, y: touch.clientY }
    startPosRef.current = pos
    
    timerRef.current = setTimeout(() => {
      isDraggingRef.current = true
      setIsLongPressing(true)
      
      // Vibrate for haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
      
      onDragStart?.(item, startPosRef.current || pos)
    }, longPressDelay)
  }, [disabled, longPressDelay, onDragStart, item])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled) return
    
    // If not yet dragging, check if user moved too much (they want to scroll)
    if (!isDraggingRef.current && startPosRef.current) {
      const touch = e.touches[0]
      const dx = Math.abs(touch.clientX - startPosRef.current.x)
      const dy = Math.abs(touch.clientY - startPosRef.current.y)
      
      // Cancel long press if moved more than 10px
      if (dx > 10 || dy > 10) {
        clearTimer()
        startPosRef.current = null
      }
    }
    // Note: actual drag move is handled by global listener
  }, [disabled, clearTimer])

  const handleTouchEnd = useCallback(() => {
    clearTimer()
    // Note: actual drag end is handled by global listener if dragging
    if (!isDraggingRef.current) {
      startPosRef.current = null
    }
  }, [clearTimer])

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimer()
  }, [clearTimer])

  return {
    isLongPressing,
    handlers: disabled ? {} : {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchEnd,
    },
  }
}
