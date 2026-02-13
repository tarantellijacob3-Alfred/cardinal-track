import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTeam, useTeamPath } from '../hooks/useTeam'

export default function Navbar() {
  const { user, profile, isCoach, isAdmin, signOut } = useAuth()
  const { team, guestMode, activeSeason } = useTeam()
  const teamPath = useTeamPath()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const effectiveIsCoach = isCoach && !guestMode

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (e) {
      console.error('Sign out error:', e)
    } finally {
      navigate(teamPath('/login'))
      window.location.reload()
    }
  }

  const isActive = (path: string) => location.pathname === path

  const navLinks = [
    { path: teamPath('/'), label: 'Dashboard' },
    { path: teamPath('/roster'), label: 'Roster' },
    { path: teamPath('/meets'), label: 'Meets' },
    { path: teamPath('/events'), label: 'Events' },
    { path: teamPath('/search'), label: 'Search' },
  ]

  // Use team logo or initials fallback
  const logoUrl = team?.logo_url || null
  const teamName = team?.name || 'Track Team'
  const schoolName = team?.school_name || 'Track & Field'
  const primaryColor = team?.primary_color || '#3B82F6'
  const secondaryColor = team?.secondary_color || '#c5a900'

  return (
    <nav className="no-print bg-navy-950 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Link to={teamPath('/')} className="flex items-center space-x-3">
              {logoUrl ? (
                <img src={logoUrl} alt={teamName} className="w-10 h-10 object-contain rounded-lg bg-white/90 p-0.5" />
              ) : (
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  {teamName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="hidden sm:block">
                <div className="font-bold text-lg leading-tight" style={{ color: primaryColor }}>{teamName}</div>
                <div className="text-xs leading-tight" style={{ color: secondaryColor }}>
                  {schoolName}
                  {activeSeason && (
                    <span className="ml-1 text-gray-400">· {activeSeason.name}</span>
                  )}
                </div>
              </div>
            </Link>
          </div>

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
            {effectiveIsCoach && (
              <Link
                to={teamPath('/settings')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(teamPath('/settings'))
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
            <Link
              to="/welcome"
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              title="Back to TrackRoster directory"
            >
              ← TrackRoster
            </Link>
            {user ? (
              <>
                <span className="text-sm text-gray-300">
                  {profile?.full_name || user.email}
                  {effectiveIsCoach && (
                    <span className="ml-2 text-xs bg-gold-500 text-navy-900 px-2 py-0.5 rounded-full font-medium">
                      Coach
                    </span>
                  )}
                  {guestMode && (
                    <span className="ml-2 text-xs bg-amber-500 text-navy-900 px-2 py-0.5 rounded-full font-medium">
                      Guest
                    </span>
                  )}
                </span>
                <button onClick={handleSignOut} className="btn-ghost text-sm text-gray-300">
                  Sign Out
                </button>
              </>
            ) : (
              <Link to={teamPath('/login')} className="btn-secondary text-sm">
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md text-gray-300 hover:text-white hover:bg-navy-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
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
                className={`block px-3 py-3 rounded-md text-base font-medium min-h-[44px] ${
                  isActive(link.path)
                    ? 'bg-navy-700 text-gold-400'
                    : 'text-gray-300 hover:bg-navy-800 hover:text-white'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {effectiveIsCoach && (
              <Link
                to={teamPath('/settings')}
                className={`block px-3 py-3 rounded-md text-base font-medium min-h-[44px] ${
                  isActive(teamPath('/settings'))
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
                  {isAdmin ? ' (Admin)' : effectiveIsCoach ? ' (Coach)' : guestMode ? ' (Guest)' : ''}
                </p>
                <button
                  onClick={() => { handleSignOut(); setMobileMenuOpen(false) }}
                  className="block w-full text-left text-sm text-gray-300 hover:text-white min-h-[44px] py-2"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to={teamPath('/login')}
                className="block btn-secondary text-center text-sm min-h-[44px] flex items-center justify-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
            )}
            <Link
              to="/welcome"
              className="block mt-2 text-center text-sm text-gray-500 hover:text-gray-300 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              ← Back to TrackRoster
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
