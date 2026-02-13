import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { to: '/admin', label: '🏠 Overview', end: true },
  { to: '/admin/teams', label: '🏟️ Teams', end: false },
  { to: '/admin/users', label: '👥 Users', end: false },
  { to: '/admin/seasons', label: '📅 Seasons', end: false },
]

export default function AdminLayout() {
  const { profile, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col min-h-screen shrink-0 hidden md:flex">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-sm">⚡</span>
            Super Admin
          </h1>
          <p className="text-xs text-gray-500 mt-1 truncate">{profile?.email}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-400'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800 space-y-2">
          <a
            href="/"
            className="block px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            ← Back to TrackBoard
          </a>
          <button
            onClick={signOut}
            className="block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-red-400 hover:bg-gray-800 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="md:hidden bg-gray-900 border-b border-gray-800 px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-xs">⚡</span>
              Super Admin
            </h1>
            <a href="/" className="text-sm text-gray-400 hover:text-white">← TrackBoard</a>
          </div>
          <nav className="flex gap-1 overflow-x-auto pb-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-400'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
