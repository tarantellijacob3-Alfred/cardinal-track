import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react'
import type { MeetEntryWithDetails } from '../types/database'

interface DragState {
  isDragging: boolean
  draggedEntry: MeetEntryWithDetails | null
  sourceEventId: string | null
  hoverEventId: string | null
}

interface DragDropContextType {
  state: DragState
  startDrag: (entry: MeetEntryWithDetails, sourceEventId: string, initialPosition: { x: number; y: number }) => void
  updateDragPosition: (position: { x: number; y: number }) => void
  endDrag: () => { entry: MeetEntryWithDetails; targetEventId: string } | null
  registerDropZone: (eventId: string, element: HTMLElement) => void
  unregisterDropZone: (eventId: string) => void
}

const DragDropContext = createContext<DragDropContextType | null>(null)

export function DragDropProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DragState>({
    isDragging: false,
    draggedEntry: null,
    sourceEventId: null,
    hoverEventId: null,
  })
  
  const dropZonesRef = useRef<Map<string, HTMLElement>>(new Map())
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const positionRef = useRef({ x: 0, y: 0 })
  const rafRef = useRef<number | null>(null)

  // Lock body scroll when dragging
  useEffect(() => {
    if (state.isDragging) {
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
    } else {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
  }, [state.isDragging])

  // Update overlay position smoothly using RAF
  const updateOverlayPosition = useCallback(() => {
    if (overlayRef.current) {
      overlayRef.current.style.left = `${positionRef.current.x}px`
      overlayRef.current.style.top = `${positionRef.current.y}px`
    }
    rafRef.current = null
  }, [])

  // Detect which drop zone we're over
  const detectHoverZone = useCallback((x: number, y: number) => {
    let foundEventId: string | null = null

    dropZonesRef.current.forEach((element, eventId) => {
      const rect = element.getBoundingClientRect()
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        foundEventId = eventId
      }
    })

    setState(prev => {
      if (prev.hoverEventId !== foundEventId) {
        return { ...prev, hoverEventId: foundEventId }
      }
      return prev
    })
  }, [])

  // Auto-scroll only at very edges
  const handleAutoScroll = useCallback((y: number) => {
    const viewportHeight = window.innerHeight
    const edgeThreshold = 50 // Very edge only
    const scrollSpeed = 10
    
    if (y < edgeThreshold) {
      window.scrollBy(0, -scrollSpeed)
    } else if (y > viewportHeight - edgeThreshold) {
      window.scrollBy(0, scrollSpeed)
    }
  }, [])

  const startDrag = useCallback((entry: MeetEntryWithDetails, sourceEventId: string, initialPosition: { x: number; y: number }) => {
    positionRef.current = initialPosition
    setState({
      isDragging: true,
      draggedEntry: entry,
      sourceEventId,
      hoverEventId: null,
    })
    // Immediate position update
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(updateOverlayPosition)
  }, [updateOverlayPosition])

  const updateDragPosition = useCallback((position: { x: number; y: number }) => {
    positionRef.current = position
    
    // Schedule smooth position update
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(updateOverlayPosition)
    }
    
    // Detect drop zones and auto-scroll
    detectHoverZone(position.x, position.y)
    handleAutoScroll(position.y)
  }, [updateOverlayPosition, detectHoverZone, handleAutoScroll])

  const endDrag = useCallback(() => {
    const { draggedEntry, hoverEventId, sourceEventId } = state
    
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    
    setState({
      isDragging: false,
      draggedEntry: null,
      sourceEventId: null,
      hoverEventId: null,
    })

    if (draggedEntry && hoverEventId && hoverEventId !== sourceEventId) {
      return { entry: draggedEntry, targetEventId: hoverEventId }
    }
    
    return null
  }, [state])

  const registerDropZone = useCallback((eventId: string, element: HTMLElement) => {
    dropZonesRef.current.set(eventId, element)
  }, [])

  const unregisterDropZone = useCallback((eventId: string) => {
    dropZonesRef.current.delete(eventId)
  }, [])

  return (
    <DragDropContext.Provider
      value={{
        state,
        startDrag,
        updateDragPosition,
        endDrag,
        registerDropZone,
        unregisterDropZone,
      }}
    >
      {children}
      
      {/* Drag overlay - follows finger smoothly */}
      {state.isDragging && state.draggedEntry && (
        <div
          ref={overlayRef}
          className="fixed pointer-events-none z-[9999] transform -translate-x-1/2 -translate-y-full"
          style={{
            left: positionRef.current.x,
            top: positionRef.current.y,
            willChange: 'left, top',
          }}
        >
          <div className="bg-navy-800 text-white px-4 py-2 rounded-lg shadow-2xl border-2 border-brand-400">
            <span className="font-medium text-sm">
              {state.draggedEntry.athletes.last_name}, {state.draggedEntry.athletes.first_name}
            </span>
          </div>
          <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-navy-800 mx-auto" />
        </div>
      )}
    </DragDropContext.Provider>
  )
}

export function useDragDrop() {
  const context = useContext(DragDropContext)
  if (!context) {
    throw new Error('useDragDrop must be used within a DragDropProvider')
  }
  return context
}
