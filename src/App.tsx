import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import Roster from './pages/Roster'
import Meets from './pages/Meets'
import MeetDetail from './pages/MeetDetail'
import AthleteDetail from './pages/AthleteDetail'
import PublicSearch from './pages/PublicSearch'
import MeetReport from './pages/MeetReport'
import Events from './pages/Events'
import Settings from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/roster" element={<Roster />} />
            <Route path="/meets" element={<Meets />} />
            <Route path="/meets/:id" element={<MeetDetail />} />
            <Route path="/meets/:id/report" element={<MeetReport />} />
            <Route path="/events" element={<Events />} />
            <Route path="/athletes/:id" element={<AthleteDetail />} />
            <Route path="/search" element={<PublicSearch />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
