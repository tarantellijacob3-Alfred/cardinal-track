import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile, TeamMember } from '../types/database'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  memberships: TeamMember[]
  loading: boolean
  isCoach: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  /** Check if user is a coach for a specific team */
  isCoachForTeam: (teamId: string | null) => boolean
  /** Get the user's membership for a specific team */
  getMembership: (teamId: string | null) => TeamMember | null
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, fullName: string, role: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const ADMIN_EMAILS = ['tarantellijacob@gmail.com', 'ttarantelli@gmail.com']
const SUPER_ADMIN_EMAILS = ['tarantellijacob@gmail.com']

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [memberships, setMemberships] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  const isAdmin = profile?.role === 'admin' || (profile?.email != null && ADMIN_EMAILS.includes(profile.email))
  const isCoach = isAdmin || (profile?.role === 'coach' && profile?.approved === true)
  const isSuperAdmin = profile?.is_super_admin === true || (profile?.email != null && SUPER_ADMIN_EMAILS.includes(profile.email))

  /** Check if user is coach for a specific team via team_members */
  function isCoachForTeam(teamId: string | null): boolean {
    if (!profile || !teamId) return false
    if (isSuperAdmin) return true
    if (isAdmin) return true
    const m = memberships.find(m => m.team_id === teamId)
    return m?.role === 'coach' && m?.approved === true
  }

  /** Get membership record for a specific team */
  function getMembership(teamId: string | null): TeamMember | null {
    if (!teamId) return null
    return memberships.find(m => m.team_id === teamId) ?? null
  }

  async function fetchProfile(userId: string) {
    // Fetch profile and memberships in parallel
    const [profileRes, membershipsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('team_members').select('*').eq('profile_id', userId),
    ])
    setProfile(profileRes.data as Profile | null)
    setMemberships((membershipsRes.data as TeamMember[]) || [])
  }

  async function refreshProfile() {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        fetchProfile(s.user.id)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        fetchProfile(s.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error as Error | null }
  }

  async function signUp(email: string, password: string, fullName: string, role: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    })

    if (!error && data.user) {
      // Parent/athlete signups are auto-approved; coach signups need approval
      const isParentOrAthlete = role === 'parent' || role === 'athlete'
      await supabase
        .from('profiles')
        .update({
          role: isParentOrAthlete ? role : 'coach',
          approved: isParentOrAthlete ? true : false,
          full_name: fullName
        } as Record<string, unknown>)
        .eq('id', data.user.id)
    }

    return { error: error as Error | null }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setProfile(null)
    setMemberships([])
  }

  return (
    <AuthContext.Provider value={{
      user, session, profile, memberships, loading, isCoach, isAdmin, isSuperAdmin,
      isCoachForTeam, getMembership,
      signIn, signUp, signOut, refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
