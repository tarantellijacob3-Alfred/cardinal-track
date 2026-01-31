import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface Props {
  children: React.ReactNode
  requireCoach?: boolean
}

export default function ProtectedRoute({ children, requireCoach = false }: Props) {
  const { user, isCoach, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-800" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requireCoach && !isCoach) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-navy-900">Access Denied</h2>
        <p className="mt-2 text-gray-600">You need an approved coach account to access this page.</p>
      </div>
    )
  }

  return <>{children}</>
}
