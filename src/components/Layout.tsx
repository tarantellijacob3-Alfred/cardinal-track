import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import { useTeam } from '../hooks/useTeam'

export default function Layout() {
  const { team, loading, error } = useTeam()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-800" />
      </div>
    )
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-navy-900 mb-2">Team Not Found</h1>
          <p className="text-gray-500 mb-4">The team you're looking for doesn't exist or is inactive.</p>
          <a href="/" className="btn-primary inline-block">Go Home</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
      <footer className="no-print border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-gray-500">
          <p>Cardinal Track &mdash; {team.school_name} Meet Manager</p>
          <p className="mt-1">© {new Date().getFullYear()} {team.school_name}</p>
        </div>
      </footer>
    </div>
  )
}
