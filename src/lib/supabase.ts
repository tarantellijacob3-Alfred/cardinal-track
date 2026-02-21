import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Use localStorage for persistence (more reliable across tabs than sessionStorage)
    persistSession: true,
    storageKey: 'trackroster-auth',
    // Detect session in other tabs
    detectSessionInUrl: true,
    // Auto-refresh tokens before they expire
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'x-client-info': 'trackroster-web',
    },
  },
})

/**
 * Cross-tab session sync via BroadcastChannel.
 * When one tab signs out or refreshes, other tabs update too.
 */
const AUTH_CHANNEL_NAME = 'trackroster-auth-sync'
let authChannel: BroadcastChannel | null = null

try {
  if (typeof BroadcastChannel !== 'undefined') {
    authChannel = new BroadcastChannel(AUTH_CHANNEL_NAME)

    // Listen for auth changes from other tabs
    authChannel.onmessage = (event) => {
      const { type } = event.data || {}
      if (type === 'SIGNED_OUT') {
        // Another tab signed out — reload to clear state
        window.location.reload()
      } else if (type === 'SESSION_REFRESHED') {
        // Another tab refreshed the session — re-fetch ours
        supabase.auth.getSession()
      }
    }

    // Broadcast our auth changes to other tabs
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        authChannel?.postMessage({ type: 'SIGNED_OUT' })
      } else if (event === 'TOKEN_REFRESHED') {
        authChannel?.postMessage({ type: 'SESSION_REFRESHED' })
      }
    })
  }
} catch {
  // BroadcastChannel not supported — single-tab mode is fine
}

/**
 * Retry wrapper for Supabase queries that may fail due to stale auth.
 * If a query returns 401/403, refresh the session and retry once.
 */
export async function resilientQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: { message: string; code?: string; status?: number } | null }>
): Promise<{ data: T | null; error: { message: string; code?: string; status?: number } | null }> {
  const result = await queryFn()

  if (result.error && (result.error.status === 401 || result.error.code === 'PGRST301')) {
    // Session might be stale — try refreshing
    const { error: refreshError } = await supabase.auth.refreshSession()
    if (!refreshError) {
      // Retry the query with fresh tokens
      return queryFn()
    }
  }

  return result
}
