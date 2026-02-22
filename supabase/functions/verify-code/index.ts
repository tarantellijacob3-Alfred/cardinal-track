// Verifies a 6-digit code and confirms the user's email via admin API
// Returns a session so the user is automatically signed in

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_ATTEMPTS = 5

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const { email, code, password } = await req.json()
    if (!email || !code) {
      return new Response(
        JSON.stringify({ error: 'Email and code are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const normalizedEmail = email.toLowerCase()

    // Look up the verification code
    const { data: record, error: lookupErr } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', normalizedEmail)
      .single()

    if (lookupErr || !record) {
      return new Response(
        JSON.stringify({ error: 'No verification code found. Please request a new one.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Check attempts
    if (record.attempts >= MAX_ATTEMPTS) {
      // Delete the code — they need to request a new one
      await supabase.from('verification_codes').delete().eq('email', normalizedEmail)
      return new Response(
        JSON.stringify({ error: 'Too many attempts. Please request a new code.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Increment attempts
    await supabase
      .from('verification_codes')
      .update({ attempts: record.attempts + 1 })
      .eq('email', normalizedEmail)

    // Check expiry
    if (new Date(record.expires_at) < new Date()) {
      await supabase.from('verification_codes').delete().eq('email', normalizedEmail)
      return new Response(
        JSON.stringify({ error: 'Code has expired. Please request a new one.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Check code match
    if (record.code !== code.trim()) {
      const remaining = MAX_ATTEMPTS - record.attempts - 1
      return new Response(
        JSON.stringify({ error: `Invalid code. ${remaining} attempts remaining.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Code is correct! Now find the unconfirmed user and confirm them
    const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers()
    const user = users?.find(u => u.email?.toLowerCase() === normalizedEmail)

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not found. Please sign up again.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Confirm the user's email via admin API
    const { error: updateErr } = await supabase.auth.admin.updateUserById(user.id, {
      email_confirm: true,
    })

    if (updateErr) {
      console.error('Confirm user error:', updateErr)
      return new Response(
        JSON.stringify({ error: 'Failed to confirm email. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Delete the verification code (used successfully)
    await supabase.from('verification_codes').delete().eq('email', normalizedEmail)

    // Generate a session for the user by signing them in
    // We need the password to create a session
    if (password) {
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })
      if (signInErr) {
        // Even if sign-in fails, the email IS confirmed. User can sign in manually.
        return new Response(
          JSON.stringify({ verified: true, session: null, message: 'Email confirmed! Please sign in.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
      return new Response(
        JSON.stringify({ verified: true, session: signInData.session }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // No password provided — just confirm
    return new Response(
      JSON.stringify({ verified: true, session: null, message: 'Email confirmed! Please sign in.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('Verify code error:', err)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
