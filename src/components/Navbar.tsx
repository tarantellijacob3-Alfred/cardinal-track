import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const { user, profile, isCoach, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (e) {
      console.error('Sign out error:', e)
    } finally {
      navigate('/login')
      window.location.reload()
    }
  }

  const isActive = (path: string) => location.pathname === path

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/roster', label: 'Roster' },
    { path: '/meets', label: 'Meets' },
    { path: '/events', label: 'Events' },
    { path: '/search', label: 'Search' },
  ]

  return (
    <nav className="no-print bg-navy-950 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img src="/cardinal-logo.jpg" alt="Bishop Snyder Cardinals" className="w-10 h-10 object-contain" />
            <div className="hidden sm:block">
              <div className="font-bold text-lg leading-tight text-cardinal-600">Cardinal Track</div>
              <div className="text-gold-400 text-xs leading-tight">Bishop Snyder Track &amp; Field</div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'bg-navy-700 text-gold-400'
                    : 'text-gray-300 hover:bg-navy-800 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isCoach && (
              <Link
                to="/settings"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/settings')
                    ? 'bg-navy-700 text-gold-400'
                    : 'text-gray-300 hover:bg-navy-800 hover:text-white'
                }`}
              >
                Settings
              </Link>
            )}
          </div>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <>
                <span className="text-sm text-gray-300">
                  {profile?.full_name || user.email}
                  {isCoach && (
                    <span className="ml-2 text-xs bg-gold-500 text-navy-900 px-2 py-0.5 rounded-full font-medium">
                      Coach
                    </span>
                  )}
                </span>
                <button onClick={handleSignOut} className="btn-ghost text-sm text-gray-300">
                  Sign Out
                </button>
              </>
            ) : (
              <Link to="/login" className="btn-secondary text-sm">
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md text-gray-300 hover:text-white hover:bg-navy-800"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-navy-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive(link.path)
                    ? 'bg-navy-700 text-gold-400'
                    : 'text-gray-300 hover:bg-navy-800 hover:text-white'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {isCoach && (
              <Link
                to="/settings"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/settings')
                    ? 'bg-navy-700 text-gold-400'
                    : 'text-gray-300 hover:bg-navy-800 hover:text-white'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Settings
              </Link>
            )}
          </div>
          <div className="border-t border-navy-700 px-4 py-3">
            {user ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-300">
                  {profile?.full_name || user.email}
                  {isAdmin ? ' (Admin)' : isCoach ? ' (Coach)' : ''}
                </p>
                <button
                  onClick={() => { handleSignOut(); setMobileMenuOpen(false) }}
                  className="block w-full text-left text-sm text-gray-300 hover:text-white"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="block btn-secondary text-center text-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
