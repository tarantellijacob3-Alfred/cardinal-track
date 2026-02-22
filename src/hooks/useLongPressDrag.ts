import { useRef, useCallback, useEffect, useState } from 'react'

interface DragState {
  isDragging: boolean
  draggedItem: unknown | null
  dragPosition: { x: number; y: number }
}

interface UseLongPressDragOptions {
  onDragStart?: (item: unknown) => void
  onDragMove?: (position: { x: number; y: number }) => void
  onDragEnd?: () => void
  longPressDelay?: number
  disabled?: boolean
}

export function useLongPressDrag<T>(
  item: T,
  options: UseLongPressDragOptions = {}
) {
  const {
    onDragStart,
    onDragMove,
    onDragEnd,
    longPressDelay = 400,
    disabled = false,
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

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return
    
    const touch = e.touches[0]
    startPosRef.current = { x: touch.clientX, y: touch.clientY }
    
    timerRef.current = setTimeout(() => {
      isDraggingRef.current = true
      setIsLongPressing(true)
      
      // Vibrate for haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
      
      onDragStart?.(item)
    }, longPressDelay)
  }, [disabled, longPressDelay, onDragStart, item])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    const currentPos = { x: touch.clientX, y: touch.clientY }
    
    // If we haven't started dragging yet, check if we moved too much
    if (!isDraggingRef.current && startPosRef.current) {
      const dx = Math.abs(currentPos.x - startPosRef.current.x)
      const dy = Math.abs(currentPos.y - startPosRef.current.y)
      
      // If moved more than 10px before long press triggered, cancel
      if (dx > 10 || dy > 10) {
        clearTimer()
        return
      }
    }
    
    if (isDraggingRef.current) {
      e.preventDefault() // Prevent scrolling while dragging
      onDragMove?.(currentPos)
    }
  }, [clearTimer, onDragMove])

  const handleTouchEnd = useCallback(() => {
    clearTimer()
    
    if (isDraggingRef.current) {
      isDraggingRef.current = false
      setIsLongPressing(false)
      onDragEnd?.()
    }
    
    startPosRef.current = null
  }, [clearTimer, onDragEnd])

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimer()
  }, [clearTimer])

  return {
    isLongPressing,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchEnd,
    },
  }
}
