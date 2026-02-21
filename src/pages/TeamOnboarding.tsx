import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

type Step = 1 | 2 | 3 | 4

interface CoachInfo {
  fullName: string
  email: string
  password: string
  isExisting: boolean
}

interface TeamInfo {
  teamName: string
  schoolName: string
  slug: string
  logoFile: File | null
  primaryColor: string
  secondaryColor: string
}

const TRIAL_DAYS = 14

// Danny Brown promo: free season for teams created before this date
const PROMO_DEADLINE = new Date('2026-02-21T20:00:00-05:00').getTime()
const isPromoActive = () => Date.now() < PROMO_DEADLINE

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export default function TeamOnboarding() {
  const navigate = useNavigate()
  const { user, profile, signIn, refreshProfile } = useAuth()

  const [step, setStep] = useState<Step>(user ? 2 : 1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1: Coach account
  const [coach, setCoach] = useState<CoachInfo>({
    fullName: profile?.full_name || '',
    email: user?.email || '',
    password: '',
    isExisting: !!user,
  })

  // Step 2: Team info
  const [teamInfo, setTeamInfo] = useState<TeamInfo>({
    teamName: '',
    schoolName: '',
    slug: '',
    logoFile: null,
    primaryColor: '#1e3a5f',
    secondaryColor: '#c5a900',
  })

  // Step 3/4: Created team slug for redirect
  const [createdSlug, setCreatedSlug] = useState('')

  /* ── Step 1: Sign up or sign in ── */
  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (coach.isExisting) {
        // Sign in existing user
        const { error: err } = await signIn(coach.email, coach.password)
        if (err) throw err
      } else {
        // Sign up new coach account
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email: coach.email,
          password: coach.password,
          options: { data: { full_name: coach.fullName } },
        })
        if (signUpErr) throw signUpErr

        if (data.user) {
          // Update profile to coach (will be fully approved after team creation)
          await supabase
            .from('profiles')
            .update({
              role: 'coach',
              approved: true,
              full_name: coach.fullName,
            } as Record<string, unknown>)
            .eq('id', data.user.id)
        }
      }

      setStep(2)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  /* ── Step 2: Team info ── */
  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!teamInfo.teamName || !teamInfo.schoolName) {
      setError('Team name and school name are required')
      return
    }

    // Check slug availability
    const slug = teamInfo.slug || slugify(teamInfo.schoolName)
    setLoading(true)

    const { data: existing } = await supabase
      .from('teams')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) {
      setError(`The slug "${slug}" is already taken. Please choose a different one.`)
      setLoading(false)
      return
    }

    setTeamInfo(prev => ({ ...prev, slug }))
    setLoading(false)
    setStep(3)
  }

  /* ── Step 3: Plan selection → go to step 4 ── */
  const handleSelectPlan = () => {
    setStep(4)
  }

  /* ── Step 4: Create team + redirect to Stripe ── */
  const handleCreateTeamAndPay = async () => {
    setError('')
    setLoading(true)

    try {
      const { data: currentUser } = await supabase.auth.getUser()
      if (!currentUser?.user) throw new Error('Not authenticated')

      const slug = teamInfo.slug || slugify(teamInfo.schoolName)

      // Upload logo if provided
      let logoUrl: string | null = null
      if (teamInfo.logoFile) {
        const fileExt = teamInfo.logoFile.name.split('.').pop()
        const filePath = `team-logos/${slug}.${fileExt}`
        const { error: uploadErr } = await supabase.storage
          .from('team-assets')
          .upload(filePath, teamInfo.logoFile, { upsert: true })

        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('team-assets').getPublicUrl(filePath)
          logoUrl = urlData.publicUrl
        }
      }

      // Check if Danny Brown promo is active
      const promo = isPromoActive()

      // Calculate trial expiration (14 days from now) — not needed if promo
      const trialExpires = new Date()
      trialExpires.setDate(trialExpires.getDate() + TRIAL_DAYS)

      // Create the team
      const { data: team, error: teamErr } = await supabase
        .from('teams')
        .insert({
          name: teamInfo.teamName,
          slug,
          school_name: teamInfo.schoolName,
          logo_url: logoUrl,
          primary_color: teamInfo.primaryColor,
          secondary_color: teamInfo.secondaryColor,
          is_grandfathered: promo,
          active: true,
          stripe_subscription_id: null,
          trial_expires_at: promo ? null : trialExpires.toISOString(),
          created_by: currentUser.user.id,
        } as Record<string, unknown>)
        .select()
        .single()

      if (teamErr || !team) throw teamErr || new Error('Failed to create team')

      // Add creator as coach + owner in team_members
      await supabase
        .from('team_members')
        .insert({
          profile_id: currentUser.user.id,
          team_id: (team as { id: string }).id,
          role: 'coach',
          approved: true,
          is_owner: true,
        } as Record<string, unknown>)

      // Also update profiles.team_id for backward compat
      await supabase
        .from('profiles')
        .update({
          team_id: (team as { id: string }).id,
          role: 'coach',
          approved: true,
        } as Record<string, unknown>)
        .eq('id', currentUser.user.id)

      await refreshProfile()
      setCreatedSlug(slug)

      if (promo) {
        // Promo: go straight to dashboard (free season, no payment needed)
        navigate(`/t/${slug}`)
      } else {
        // Non-promo: redirect to Stripe checkout with 14-day trial
        try {
          const { data: sessionData } = await supabase.auth.getSession()
          const token = sessionData?.session?.access_token
          if (!token) throw new Error('No auth token')

          const res = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                teamId: (team as { id: string }).id,
                trial: true,
              }),
            }
          )

          const { url, error: checkoutErr } = await res.json()
          if (checkoutErr) throw new Error(checkoutErr)

          if (url) {
            window.location.href = url
          } else {
            // Fallback: go to dashboard (trial will still work from trial_expires_at)
            navigate(`/t/${slug}`)
          }
        } catch (stripeErr) {
          console.error('Stripe checkout redirect failed:', stripeErr)
          // Fallback: go to dashboard with trial active
          navigate(`/t/${slug}`)
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create team')
    } finally {
      setLoading(false)
    }
  }

  const features = [
    'Unlimited athletes on your roster',
    'Unlimited meet entries & Hy-Tek export',
    'Public search for parents & athletes',
    'Meet reports with print-ready layouts',
    'CSV/bulk roster import',
    'TFRRS linking for results',
    'Parent favorites & notifications',
    'Custom team branding & colors',
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800">
      {/* Nav */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center sm:justify-between gap-2">
        <Link to="/welcome" className="flex items-center space-x-3">
          <img src="/trackroster-logo.svg" alt="TrackRoster" className="w-10 h-10" />
          <span className="text-white font-bold text-xl">TrackRoster</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/" className="text-gray-400 hover:text-white text-xs sm:text-sm font-medium whitespace-nowrap">
            ← Back
          </Link>
          <Link to="/login" className="text-gray-300 hover:text-white text-xs sm:text-sm font-medium whitespace-nowrap">
            Already have an account? Sign In
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  s <= step ? 'bg-brand-400 text-navy-900' : 'bg-navy-700 text-gray-400'
                }`}>
                  {s < step ? '✓' : s}
                </div>
                {s < 4 && (
                  <div className={`w-16 sm:w-24 h-1 mx-1 rounded ${
                    s < step ? 'bg-brand-400' : 'bg-navy-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>Account</span>
            <span>Team Info</span>
            <span>Plan</span>
            <span>Launch</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* ══════ Step 1: Coach Account ══════ */}
        {step === 1 && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-navy-900 mb-1">Create Your Coach Account</h2>
            <p className="text-gray-500 mb-6">Or sign in if you already have one</p>

            {/* Toggle */}
            <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-6">
              <button
                onClick={() => setCoach(prev => ({ ...prev, isExisting: false }))}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  !coach.isExisting ? 'bg-navy-800 text-white' : 'bg-gray-50 text-gray-600'
                }`}
              >
                New Account
              </button>
              <button
                onClick={() => setCoach(prev => ({ ...prev, isExisting: true }))}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  coach.isExisting ? 'bg-navy-800 text-white' : 'bg-gray-50 text-gray-600'
                }`}
              >
                Sign In
              </button>
            </div>

            <form onSubmit={handleStep1} className="space-y-4">
              {!coach.isExisting && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={coach.fullName}
                    onChange={e => setCoach(prev => ({ ...prev, fullName: e.target.value }))}
                    className="input"
                    required={!coach.isExisting}
                    placeholder="Coach Smith"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={coach.email}
                  onChange={e => setCoach(prev => ({ ...prev, email: e.target.value }))}
                  className="input"
                  required
                  placeholder="coach@school.edu"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={coach.password}
                  onChange={e => setCoach(prev => ({ ...prev, password: e.target.value }))}
                  className="input"
                  required
                  minLength={6}
                  placeholder="••••••••"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full min-h-[44px]">
                {loading ? 'Please wait...' : coach.isExisting ? 'Sign In & Continue' : 'Create Account & Continue'}
              </button>
            </form>
          </div>
        )}

        {/* ══════ Step 2: Team Info ══════ */}
        {step === 2 && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-navy-900 mb-1">Set Up Your Team</h2>
            <p className="text-gray-500 mb-6">Tell us about your track & field program</p>

            <form onSubmit={handleStep2} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                <input
                  type="text"
                  value={teamInfo.teamName}
                  onChange={e => setTeamInfo(prev => ({ ...prev, teamName: e.target.value }))}
                  className="input"
                  required
                  placeholder='e.g. "Eagles Track & Field"'
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                <input
                  type="text"
                  value={teamInfo.schoolName}
                  onChange={e => {
                    const schoolName = e.target.value
                    setTeamInfo(prev => ({
                      ...prev,
                      schoolName,
                      slug: slugify(schoolName),
                    }))
                  }}
                  className="input"
                  required
                  placeholder='e.g. "Lincoln High School"'
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team URL Slug
                  <span className="text-gray-400 font-normal ml-1">(auto-generated)</span>
                </label>
                <div className="flex items-center">
                  <span className="text-gray-400 text-sm mr-1">mytrackroster.com/t/</span>
                  <input
                    type="text"
                    value={teamInfo.slug}
                    onChange={e => setTeamInfo(prev => ({ ...prev, slug: slugify(e.target.value) }))}
                    className="input flex-1"
                    required
                    placeholder="lincoln-high-school"
                  />
                </div>
              </div>

              {/* Colors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={teamInfo.primaryColor}
                      onChange={e => setTeamInfo(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-10 h-10 rounded border border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={teamInfo.primaryColor}
                      onChange={e => setTeamInfo(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="input flex-1 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={teamInfo.secondaryColor}
                      onChange={e => setTeamInfo(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="w-10 h-10 rounded border border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={teamInfo.secondaryColor}
                      onChange={e => setTeamInfo(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="input flex-1 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Logo upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team Logo <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setTeamInfo(prev => ({ ...prev, logoFile: e.target.files?.[0] || null }))}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-navy-50 file:text-navy-700 hover:file:bg-navy-100"
                />
              </div>

              {/* Preview */}
              <div className="border border-gray-200 rounded-lg p-4 mt-4">
                <p className="text-xs text-gray-400 mb-2">Preview</p>
                <div className="flex items-center space-x-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: teamInfo.primaryColor }}
                  >
                    {teamInfo.teamName ? teamInfo.teamName.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div>
                    <p className="font-bold" style={{ color: teamInfo.primaryColor }}>
                      {teamInfo.teamName || 'Team Name'}
                    </p>
                    <p className="text-xs" style={{ color: teamInfo.secondaryColor }}>
                      {teamInfo.schoolName || 'School Name'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-ghost flex-1 min-h-[44px]"
                >
                  Back
                </button>
                <button type="submit" disabled={loading} className="btn-primary flex-1 min-h-[44px]">
                  {loading ? 'Checking...' : 'Continue'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ══════ Step 3: Plan Info ══════ */}
        {step === 3 && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-navy-900 mb-1">Your Plan</h2>

            {isPromoActive() ? (
              <>
                <p className="text-gray-500 mb-6">Limited-time offer — create your team now and get a full season free</p>

                <div className="border-2 border-brand-400 rounded-xl p-6 relative">
                  <div className="absolute -top-3 left-4 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                    FREE SEASON — LIMITED TIME
                  </div>
                  <div className="flex items-baseline justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-navy-900">Season Pass</h3>
                      <p className="text-sm text-gray-500">Full access for your entire season</p>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-bold text-navy-900 line-through text-gray-400">$300</span>
                      <span className="text-3xl font-bold text-green-600 ml-2">FREE</span>
                    </div>
                  </div>

                  <div className="bg-brand-50 border border-brand-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-brand-800 font-medium">
                      Countdown to Danny Brown — create your team before the clock runs out!
                    </p>
                    <p className="text-xs text-brand-700 mt-1">
                      Full season access, completely free. No credit card, no catch.
                    </p>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {features.map(feature => (
                      <li key={feature} className="flex items-start space-x-2">
                        <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={handleSelectPlan}
                    className="btn-primary w-full min-h-[44px] text-lg"
                  >
                    Claim Free Season & Create Team
                  </button>

                  <p className="text-xs text-gray-400 text-center mt-3">
                    No payment info needed. Your full season is on us.
                  </p>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-500 mb-6">Try TrackRoster free for {TRIAL_DAYS} days — cancel anytime</p>

                <div className="border-2 border-brand-400 rounded-xl p-6 relative">
                  <div className="absolute -top-3 left-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {TRIAL_DAYS}-DAY FREE TRIAL
                  </div>
                  <div className="flex items-baseline justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-navy-900">Season Pass</h3>
                      <p className="text-sm text-gray-500">Full access for your entire season</p>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-bold text-navy-900">$300</span>
                      <span className="text-gray-500">/season</span>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-green-800 font-medium">
                      Start free today — {TRIAL_DAYS} days on us
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      Full access for {TRIAL_DAYS} days. After that, you'll be charged $300/season automatically. Cancel anytime before the trial ends — no charge.
                    </p>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {features.map(feature => (
                      <li key={feature} className="flex items-start space-x-2">
                        <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={handleSelectPlan}
                    className="btn-primary w-full min-h-[44px] text-lg"
                  >
                    Start Free Trial & Create Team
                  </button>

                  <p className="text-xs text-gray-400 text-center mt-3">
                    You'll enter payment info on the next step. You won't be charged until after your {TRIAL_DAYS}-day trial.
                  </p>
                </div>
              </>
            )}

            <button
              onClick={() => setStep(2)}
              className="btn-ghost w-full mt-4 min-h-[44px]"
            >
              Back to Team Info
            </button>
          </div>
        )}

        {/* ══════ Step 4: Launch ══════ */}
        {step === 4 && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl text-center">
            <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🚀</span>
            </div>
            <h2 className="text-2xl font-bold text-navy-900 mb-2">Ready to Launch!</h2>
            <p className="text-gray-500 mb-6">
              We'll create your team <strong>{teamInfo.teamName}</strong> at{' '}
              <code className="text-navy-600 bg-gray-100 px-1 py-0.5 rounded text-sm">
                /t/{teamInfo.slug}
              </code>
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6 text-left">
              <p className="text-sm text-green-800">
                {isPromoActive()
                  ? '✅ Your full season is free — Countdown to Danny Brown promo applied!'
                  : `✅ ${TRIAL_DAYS}-day free trial. You'll add a card next — you won't be charged until day ${TRIAL_DAYS}. Cancel anytime.`
                }
              </p>
            </div>

            <button
              onClick={handleCreateTeamAndPay}
              disabled={loading}
              className="btn-primary w-full min-h-[44px] text-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>Creating your team...</span>
                </span>
              ) : (
                'Launch My Team 🚀'
              )}
            </button>

            <button
              onClick={() => setStep(3)}
              className="btn-ghost w-full mt-3 min-h-[44px]"
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
