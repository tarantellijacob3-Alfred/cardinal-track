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

/**
 * Client-side rate limiter for auth operations.
 * Prevents rapid-fire login/signup attempts.
 */
const AUTH_RATE_LIMIT = {
  maxAttempts: 5,
  windowMs: 60 * 1000, // 1 minute
  attempts: [] as number[],
}

function checkRateLimit(): boolean {
  const now = Date.now()
  // Clean old attempts outside the window
  AUTH_RATE_LIMIT.attempts = AUTH_RATE_LIMIT.attempts.filter(
    t => now - t < AUTH_RATE_LIMIT.windowMs
  )
  if (AUTH_RATE_LIMIT.attempts.length >= AUTH_RATE_LIMIT.maxAttempts) {
    return false // Rate limited
  }
  AUTH_RATE_LIMIT.attempts.push(now)
  return true
}

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
    let mounted = true
    let retryCount = 0
    const MAX_RETRIES = 2

    async function initSession() {
      try {
        const { data: { session: s }, error } = await supabase.auth.getSession()

        if (!mounted) return

        if (error) {
          console.warn('Failed to get session:', error.message)
          // If session fetch fails, try refreshing
          if (retryCount < MAX_RETRIES) {
            retryCount++
            const { data: refreshData } = await supabase.auth.refreshSession()
            if (mounted && refreshData.session) {
              setSession(refreshData.session)
              setUser(refreshData.session.user)
              await fetchProfile(refreshData.session.user.id)
              setLoading(false)
              return
            }
          }
          // Give up — set to logged-out state
          setSession(null)
          setUser(null)
          setProfile(null)
          setLoading(false)
          return
        }

        setSession(s)
        setUser(s?.user ?? null)
        if (s?.user) {
          await fetchProfile(s.user.id)
        }
        setLoading(false)
      } catch (err) {
        console.error('Auth init error:', err)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        fetchProfile(s.user.id)
      } else {
        setProfile(null)
        setMemberships([])
      }
    })

    // Visibility change handler: re-validate session when tab becomes visible
    // This fixes the "stale tab" problem when returning to a background tab
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        supabase.auth.getSession().then(({ data: { session: s }, error }) => {
          if (!mounted) return
          if (error || !s) {
            // Session expired while tab was hidden
            supabase.auth.refreshSession().then(({ data: refreshData }) => {
              if (!mounted) return
              if (refreshData.session) {
                setSession(refreshData.session)
                setUser(refreshData.session.user)
                fetchProfile(refreshData.session.user.id)
              } else {
                // Fully expired — sign out cleanly
                setSession(null)
                setUser(null)
                setProfile(null)
                setMemberships([])
              }
            })
          } else {
            setSession(s)
            setUser(s.user)
          }
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      mounted = false
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  async function signIn(email: string, password: string) {
    if (!checkRateLimit()) {
      return { error: new Error('Too many attempts. Please wait a minute and try again.') }
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error as Error | null }
  }

  async function signUp(email: string, password: string, fullName: string, role: string) {
    if (!checkRateLimit()) {
      return { error: new Error('Too many attempts. Please wait a minute and try again.') }
    }
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
