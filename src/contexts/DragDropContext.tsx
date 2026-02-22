import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react'
import type { MeetEntryWithDetails } from '../types/database'

interface DragState {
  isDragging: boolean
  draggedEntry: MeetEntryWithDetails | null
  dragPosition: { x: number; y: number }
  sourceEventId: string | null
  hoverEventId: string | null
}

interface DragDropContextType {
  state: DragState
  startDrag: (entry: MeetEntryWithDetails, sourceEventId: string) => void
  updateDragPosition: (position: { x: number; y: number }) => void
  setHoverEvent: (eventId: string | null) => void
  endDrag: () => { entry: MeetEntryWithDetails; targetEventId: string } | null
  registerDropZone: (eventId: string, element: HTMLElement) => void
  unregisterDropZone: (eventId: string) => void
}

const DragDropContext = createContext<DragDropContextType | null>(null)

export function DragDropProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DragState>({
    isDragging: false,
    draggedEntry: null,
    dragPosition: { x: 0, y: 0 },
    sourceEventId: null,
    hoverEventId: null,
  })
  
  const dropZonesRef = useRef<Map<string, HTMLElement>>(new Map())
  const scrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastScrollTimeRef = useRef<number>(0)

  // Auto-scroll logic
  useEffect(() => {
    if (!state.isDragging) {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current)
        scrollIntervalRef.current = null
      }
      return
    }

    const handleAutoScroll = () => {
      const { y } = state.dragPosition
      const viewportHeight = window.innerHeight
      const scrollThreshold = 100 // pixels from edge to trigger scroll
      const scrollSpeed = 10 // pixels per frame
      
      const now = Date.now()
      if (now - lastScrollTimeRef.current < 16) return // ~60fps throttle
      lastScrollTimeRef.current = now

      if (y < scrollThreshold) {
        // Scroll up
        const intensity = 1 - (y / scrollThreshold)
        window.scrollBy(0, -scrollSpeed * intensity)
      } else if (y > viewportHeight - scrollThreshold) {
        // Scroll down
        const intensity = 1 - ((viewportHeight - y) / scrollThreshold)
        window.scrollBy(0, scrollSpeed * intensity)
      }
    }

    scrollIntervalRef.current = setInterval(handleAutoScroll, 16)
    
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current)
        scrollIntervalRef.current = null
      }
    }
  }, [state.isDragging, state.dragPosition])

  // Detect which drop zone we're over
  useEffect(() => {
    if (!state.isDragging) return

    const { x, y } = state.dragPosition
    let foundEventId: string | null = null

    dropZonesRef.current.forEach((element, eventId) => {
      const rect = element.getBoundingClientRect()
      if (
        x >= rect.left &&
        x <= rect.right &&
        y >= rect.top &&
        y <= rect.bottom
      ) {
        foundEventId = eventId
      }
    })

    if (foundEventId !== state.hoverEventId) {
      setState(prev => ({ ...prev, hoverEventId: foundEventId }))
    }
  }, [state.isDragging, state.dragPosition, state.hoverEventId])

  const startDrag = useCallback((entry: MeetEntryWithDetails, sourceEventId: string) => {
    setState({
      isDragging: true,
      draggedEntry: entry,
      dragPosition: { x: 0, y: 0 },
      sourceEventId,
      hoverEventId: null,
    })
  }, [])

  const updateDragPosition = useCallback((position: { x: number; y: number }) => {
    setState(prev => ({ ...prev, dragPosition: position }))
  }, [])

  const setHoverEvent = useCallback((eventId: string | null) => {
    setState(prev => ({ ...prev, hoverEventId: eventId }))
  }, [])

  const endDrag = useCallback(() => {
    const { draggedEntry, hoverEventId, sourceEventId } = state
    
    // Reset state
    setState({
      isDragging: false,
      draggedEntry: null,
      dragPosition: { x: 0, y: 0 },
      sourceEventId: null,
      hoverEventId: null,
    })

    // Return the result if we have a valid drop
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
        setHoverEvent,
        endDrag,
        registerDropZone,
        unregisterDropZone,
      }}
    >
      {children}
      
      {/* Drag overlay - floating athlete card */}
      {state.isDragging && state.draggedEntry && (
        <div
          className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: state.dragPosition.x,
            top: state.dragPosition.y,
          }}
        >
          <div className="bg-navy-800 text-white px-4 py-2 rounded-lg shadow-xl border-2 border-brand-400 animate-pulse">
            <span className="font-medium">
              {state.draggedEntry.athletes.last_name}, {state.draggedEntry.athletes.first_name}
            </span>
          </div>
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
