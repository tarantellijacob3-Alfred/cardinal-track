import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { TeamProvider } from './contexts/TeamContext'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import TeamLogin from './pages/TeamLogin'
import TeamRegister from './pages/TeamRegister'
import TeamParentSignup from './pages/TeamParentSignup'
import Roster from './pages/Roster'
import Meets from './pages/Meets'
import MeetDetail from './pages/MeetDetail'
import AthleteDetail from './pages/AthleteDetail'
import PublicSearch from './pages/PublicSearch'
import MeetReport from './pages/MeetReport'
import Events from './pages/Events'
import Settings from './pages/Settings'
import TeamOnboarding from './pages/TeamOnboarding'
import JoinTeam from './pages/JoinTeam'
import MyFavorites from './pages/MyFavorites'
import SuperAdminGuard from './components/SuperAdminGuard'
import AdminLayout from './components/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminTeams from './pages/admin/AdminTeams'
import AdminUsers from './pages/admin/AdminUsers'
import AdminSeasons from './pages/admin/AdminSeasons'
import InstallPrompt from './components/InstallPrompt'
import OfflineIndicator from './components/OfflineIndicator'
import ScrollToTop from './components/ScrollToTop'

/** Default team slug for backward-compatible redirects */
const DEFAULT_SLUG = 'bishop-snyder'

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ScrollToTop />
        <OfflineIndicator />
        <InstallPrompt />
        <Routes>
          {/* Root → Landing page (team directory) */}
          <Route path="/" element={<Landing />} />
          {/* Keep /welcome as alias */}
          <Route path="/welcome" element={<Landing />} />

          {/* Global auth routes → redirect to landing with message to select a team */}
          <Route path="/login" element={<Navigate to="/?message=Select a team first, then sign in from their page." replace />} />
          <Route path="/register" element={<Navigate to="/?message=Select a team first, then register from their page." replace />} />
          <Route path="/parent-signup" element={<Navigate to="/?message=Select a team first, then sign up from their page." replace />} />

          {/* ══════ Super Admin Dashboard ══════ */}
          <Route path="/admin" element={<SuperAdminGuard><AdminLayout /></SuperAdminGuard>}>
            <Route index element={<AdminDashboard />} />
            <Route path="teams" element={<AdminTeams />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="seasons" element={<AdminSeasons />} />
          </Route>

          {/* Onboarding stays global (creating a new team) */}
          <Route path="/onboard" element={<TeamOnboarding />} />
          <Route path="/join" element={<JoinTeam />} />

          {/* ══════ Backward-compatible redirects ══════ */}
          <Route path="/roster" element={<Navigate to={`/t/${DEFAULT_SLUG}/roster`} replace />} />
          <Route path="/meets" element={<Navigate to={`/t/${DEFAULT_SLUG}/meets`} replace />} />
          <Route path="/meets/:id" element={<RedirectMeet />} />
          <Route path="/meets/:id/report" element={<RedirectMeetReport />} />
          <Route path="/events" element={<Navigate to={`/t/${DEFAULT_SLUG}/events`} replace />} />
          <Route path="/athletes/:id" element={<RedirectAthlete />} />
          <Route path="/search" element={<Navigate to={`/t/${DEFAULT_SLUG}/search`} replace />} />
          <Route path="/settings" element={<Navigate to={`/t/${DEFAULT_SLUG}/settings`} replace />} />

          {/* ══════ Team-scoped auth routes (full-page, no Layout) ══════ */}
          <Route path="/t/:slug/login" element={<TeamProvider><TeamLogin /></TeamProvider>} />
          <Route path="/t/:slug/register" element={<TeamProvider><TeamRegister /></TeamProvider>} />
          <Route path="/t/:slug/parent-signup" element={<TeamProvider><TeamParentSignup /></TeamProvider>} />

          {/* ══════ Team-scoped routes (with Layout) ══════ */}
          <Route path="/t/:slug" element={<TeamProvider><Layout /></TeamProvider>}>
            <Route index element={<Dashboard />} />
            <Route path="roster" element={<Roster />} />
            <Route path="meets" element={<Meets />} />
            <Route path="meets/:id" element={<MeetDetail />} />
            <Route path="meets/:id/report" element={<MeetReport />} />
            <Route path="events" element={<Events />} />
            <Route path="athletes/:id" element={<AthleteDetail />} />
            <Route path="search" element={<PublicSearch />} />
            <Route path="settings" element={<Settings />} />
            <Route path="favorites" element={<MyFavorites />} />
          </Route>

          {/* Catch-all → landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

/* ── Redirect helpers for parameterized routes ── */
import { useParams } from 'react-router-dom'

function RedirectMeet() {
  const { id } = useParams()
  return <Navigate to={`/t/${DEFAULT_SLUG}/meets/${id}`} replace />
}

function RedirectMeetReport() {
  const { id } = useParams()
  return <Navigate to={`/t/${DEFAULT_SLUG}/meets/${id}/report`} replace />
}

function RedirectAthlete() {
  const { id } = useParams()
  return <Navigate to={`/t/${DEFAULT_SLUG}/athletes/${id}`} replace />
}
