import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Landing() {
  const { user, profile } = useAuth()

  // If a logged-in user has a team, redirect them
  const teamSlug = profile?.team_id ? null : null // Future: resolve slug from profile.team_id

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800">
      {/* Nav */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img src="/cardinal-logo.jpg" alt="Cardinal Track" className="w-10 h-10 object-contain" />
          <span className="text-white font-bold text-xl">Cardinal Track</span>
        </div>
        <div className="flex items-center space-x-4">
          {user ? (
            <Link
              to={teamSlug ? `/t/${teamSlug}` : '/t/bishop-snyder'}
              className="bg-gold-400 text-navy-900 px-4 py-2 rounded-lg font-medium hover:bg-gold-300 transition-colors"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-gray-300 hover:text-white transition-colors font-medium">
                Sign In
              </Link>
              <Link
                to="/t/bishop-snyder"
                className="bg-gold-400 text-navy-900 px-4 py-2 rounded-lg font-medium hover:bg-gold-300 transition-colors"
              >
                View Dashboard
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32 text-center">
        <h1 className="text-4xl sm:text-6xl font-bold text-white leading-tight">
          Manage Your Track Team
          <span className="block text-gold-400 mt-2">Like a Pro</span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
          Roster management, meet entries, Hy-Tek export, and more.
          Built for high school track &amp; field coaches.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/t/bishop-snyder"
            className="bg-cardinal-600 text-white px-8 py-3 rounded-lg font-medium text-lg hover:bg-cardinal-700 transition-colors"
          >
            See It In Action
          </Link>
          <Link
            to="/t/bishop-snyder/search"
            className="border border-gray-500 text-gray-300 px-8 py-3 rounded-lg font-medium text-lg hover:bg-navy-700 transition-colors"
          >
            Search Athletes
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'Roster Management', desc: 'Track athletes by grade, level, and gender. Bulk import from CSV.', icon: '👥' },
            { title: 'Meet Entries', desc: 'Assign athletes to events with 4-event limit enforcement.', icon: '🏃' },
            { title: 'Hy-Tek Export', desc: 'Generate industry-standard entry files for any meet management software.', icon: '📄' },
            { title: 'Meet Reports', desc: 'Print-ready per-athlete event rosters at a glance.', icon: '📊' },
            { title: 'Public Search', desc: 'Parents can look up any athlete\'s assignments without an account.', icon: '🔍' },
            { title: 'Mobile Ready', desc: 'Works great on phones, tablets, and desktops.', icon: '📱' },
          ].map((feature) => (
            <div key={feature.title} className="bg-navy-800/50 border border-navy-700 rounded-xl p-6">
              <span className="text-3xl">{feature.icon}</span>
              <h3 className="text-white font-semibold text-lg mt-3">{feature.title}</h3>
              <p className="text-gray-400 mt-2 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-navy-700 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          <p>Cardinal Track &mdash; Track &amp; Field Meet Manager</p>
          <p className="mt-1">© {new Date().getFullYear()} Cardinal Track</p>
        </div>
      </footer>
    </div>
  )
}
