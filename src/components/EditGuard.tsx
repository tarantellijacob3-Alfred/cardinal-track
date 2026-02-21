import { useTrialStatus } from '../hooks/useTrialStatus'

interface EditGuardProps {
  children: React.ReactNode
  /** Fallback to show when editing is blocked (optional) */
  fallback?: React.ReactNode
}

/**
 * Wraps any editable UI element. When the trial is expired,
 * shows a disabled overlay or fallback instead of the edit controls.
 */
export default function EditGuard({ children, fallback }: EditGuardProps) {
  const { canEdit } = useTrialStatus()

  if (canEdit) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  // Default: render children but with a disabled overlay
  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none select-none" aria-disabled="true">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="bg-gray-900/80 text-white text-xs px-3 py-1.5 rounded-full font-medium">
          🔒 Subscribe to edit
        </span>
      </div>
    </div>
  )
}

/**
 * Hook version: returns whether editing is allowed.
 * Use this when you need programmatic checks instead of wrapping UI.
 */
export function useCanEdit(): boolean {
  const { canEdit } = useTrialStatus()
  return canEdit
}
