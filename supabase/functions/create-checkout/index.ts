// Creates a Stripe Checkout Session for TrackRoster team subscription
// Called from the frontend when a coach clicks "Subscribe"
// Supports trial mode (14-day free trial with card upfront)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@17?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-12-18.acacia',
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

// TrackRoster Season Pass — $300/season recurring
const PRICE_ID = Deno.env.get('STRIPE_TRACKROSTER_PRICE_ID') || 'price_1T34nk2RPGT6e1lkmKo1Hfne'

const TRIAL_DAYS = 14

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  try {
    // Verify the user is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const { teamId, trial } = await req.json()
    if (!teamId) {
      return new Response('Missing teamId', { status: 400, headers: corsHeaders })
    }

    // Verify user is a coach/owner of this team
    const { data: membership } = await supabase
      .from('team_members')
      .select('*')
      .eq('profile_id', user.id)
      .eq('team_id', teamId)
      .single()

    if (!membership || membership.role !== 'coach') {
      return new Response('Not authorized for this team', { status: 403, headers: corsHeaders })
    }

    // Get team info for the checkout session
    const { data: team } = await supabase
      .from('teams')
      .select('name, school_name, slug')
      .eq('id', teamId)
      .single()

    const teamSlug = team?.slug || teamId

    // Build checkout session params
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: PRICE_ID,
          quantity: 1,
        },
      ],
      client_reference_id: teamId,
      customer_email: user.email,
      metadata: {
        team_id: teamId,
        team_name: team?.name || '',
        school_name: team?.school_name || '',
      },
      success_url: `${req.headers.get('origin')}/t/${teamSlug}?payment=success`,
      cancel_url: `${req.headers.get('origin')}/t/${teamSlug}?payment=cancelled`,
    }

    // Add 14-day trial if requested (new team onboarding)
    if (trial) {
      sessionParams.subscription_data = {
        trial_period_days: TRIAL_DAYS,
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('Checkout error:', err)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
