// Sends a 6-digit verification code via Resend for email confirmation
// Also creates the user (unconfirmed) via admin API if they don't exist yet
// This replaces Supabase's built-in signup email entirely

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function generateCode(): string {
  // 6-digit random code
  return Math.floor(100000 + Math.random() * 900000).toString()
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const { email, fullName, password } = await req.json()
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const normalizedEmail = email.toLowerCase()

    // Check if user already exists
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const existingUser = users?.find(u => u.email?.toLowerCase() === normalizedEmail)

    if (existingUser) {
      // If user exists AND is confirmed, they should sign in instead
      if (existingUser.email_confirmed_at) {
        return new Response(
          JSON.stringify({ error: 'An account with this email already exists. Try signing in instead.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
      // User exists but unconfirmed — update their password and resend code
      await supabase.auth.admin.updateUserById(existingUser.id, {
        password,
        user_metadata: { full_name: fullName || existingUser.user_metadata?.full_name },
      })
    } else {
      // Create new user (unconfirmed)
      const { error: createErr } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: false,
        user_metadata: { full_name: fullName },
      })
      if (createErr) {
        console.error('Create user error:', createErr)
        return new Response(
          JSON.stringify({ error: createErr.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
    }

    const code = generateCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 min expiry

    // Upsert verification code (replace any existing code for this email)
    const { error: dbError } = await supabase
      .from('verification_codes')
      .upsert(
        { email: normalizedEmail, code, expires_at: expiresAt, attempts: 0 },
        { onConflict: 'email' },
      )

    if (dbError) {
      console.error('DB error:', dbError)
      return new Response(
        JSON.stringify({ error: 'Failed to generate verification code' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Send email via Resend
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #1e3a5f; font-size: 24px; margin: 0;">TrackRoster</h1>
        </div>
        <h2 style="color: #1e3a5f; font-size: 20px;">Welcome${fullName ? ', ' + fullName : ''}!</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Your verification code is:</p>
        <div style="background: #f3f4f6; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1e3a5f; font-family: monospace;">${code}</span>
        </div>
        <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">Enter this code to verify your email and get started with TrackRoster.</p>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">This code expires in 10 minutes. If you didn't sign up for TrackRoster, you can safely ignore this email.</p>
      </div>
    `

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TrackRoster <noreply@mytrackroster.com>',
        to: [email],
        subject: 'Your TrackRoster verification code',
        html: emailHtml,
      }),
    })

    const resendData = await resendRes.json()

    if (!resendRes.ok) {
      console.error('Resend error:', resendData)
      // If Resend fails (e.g. domain not verified), fall back to telling user
      return new Response(
        JSON.stringify({ error: 'Failed to send verification email. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify({ success: true, messageId: resendData.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('Send verification error:', err)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
