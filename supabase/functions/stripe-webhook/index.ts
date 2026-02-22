// Stripe webhook handler for TrackRoster
// Handles checkout completion, subscription lifecycle, and trial management
// NEW: Creates team on checkout.session.completed if mode=new_team

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@17?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-12-18.acacia',
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

const TRIAL_DAYS = 14

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return new Response('Missing signature', { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return new Response(`Webhook Error: ${(err as Error).message}`, { status: 400 })
  }

  console.log(`Received event: ${event.type}`)

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const metadata = session.metadata || {}
      const subscriptionId = session.subscription as string | null

      // Determine trial end date
      let trialEnd: Date | null = null
      if (subscriptionId) {
        const sub = await stripe.subscriptions.retrieve(subscriptionId)
        if (sub.trial_end) {
          trialEnd = new Date(sub.trial_end * 1000)
        }
      }

      if (metadata.mode === 'new_team') {
        // NEW TEAM FLOW: Create the team now that payment/trial has started
        console.log(`Creating new team: ${metadata.team_name} (${metadata.slug})`)

        const trialExpires = trialEnd || new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000)

        // Create the team
        const { data: team, error: teamErr } = await supabase
          .from('teams')
          .insert({
            name: metadata.team_name,
            slug: metadata.slug,
            school_name: metadata.school_name,
            logo_url: metadata.logo_url || null,
            primary_color: metadata.primary_color || '#1e3a5f',
            secondary_color: metadata.secondary_color || '#c5a900',
            stripe_subscription_id: subscriptionId,
            is_grandfathered: false,
            active: true,
            trial_expires_at: trialEnd ? trialEnd.toISOString() : trialExpires.toISOString(),
            created_by: metadata.user_id,
          })
          .select()
          .single()

        if (teamErr || !team) {
          console.error('Failed to create team:', teamErr)
          return new Response('Failed to create team', { status: 500 })
        }

        console.log(`Team created: ${team.id}`)

        // Add user as coach + owner
        const { error: memberErr } = await supabase
          .from('team_members')
          .insert({
            profile_id: metadata.user_id,
            team_id: team.id,
            role: 'coach',
            approved: true,
            is_owner: true,
          })

        if (memberErr) {
          console.error('Failed to add team member:', memberErr)
        }

        // Update profile
        await supabase
          .from('profiles')
          .update({
            team_id: team.id,
            role: 'coach',
            approved: true,
          })
          .eq('id', metadata.user_id)

        console.log(`Team ${team.id} created with trial until ${trialExpires.toISOString()}`)

      } else {
        // EXISTING TEAM FLOW: Update team with subscription
        const teamId = session.client_reference_id || metadata.team_id
        if (!teamId) {
          console.error('No team_id in checkout session')
          break
        }

        console.log(`Checkout completed for existing team: ${teamId}`)

        if (trialEnd) {
          const { error } = await supabase
            .from('teams')
            .update({
              stripe_subscription_id: subscriptionId,
              trial_expires_at: trialEnd.toISOString(),
              active: true,
            })
            .eq('id', teamId)

          if (error) {
            console.error('Failed to update team (trial):', error)
            return new Response('Database update failed', { status: 500 })
          }
          console.log(`Team ${teamId} started trial until ${trialEnd.toISOString()}`)
        } else {
          const { error } = await supabase
            .from('teams')
            .update({
              stripe_subscription_id: subscriptionId || `paid_${session.id}`,
              trial_expires_at: null,
              active: true,
            })
            .eq('id', teamId)

          if (error) {
            console.error('Failed to update team:', error)
            return new Response('Database update failed', { status: 500 })
          }
          console.log(`Team ${teamId} activated with direct payment`)
        }
      }
      break
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice
      const subscriptionId = invoice.subscription as string | null
      if (!subscriptionId) break

      const { data: team } = await supabase
        .from('teams')
        .select('id')
        .eq('stripe_subscription_id', subscriptionId)
        .single()

      if (team) {
        await supabase
          .from('teams')
          .update({
            trial_expires_at: null,
            active: true,
          })
          .eq('id', team.id)

        console.log(`Team ${team.id} payment confirmed, trial cleared`)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const subId = subscription.id

      const { error } = await supabase
        .from('teams')
        .update({ stripe_subscription_id: null })
        .eq('stripe_subscription_id', subId)

      if (error) {
        console.error('Failed to handle subscription deletion:', error)
      } else {
        console.log(`Subscription ${subId} cancelled, team set to view-only`)
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      
      if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
        const { error } = await supabase
          .from('teams')
          .update({ stripe_subscription_id: null })
          .eq('stripe_subscription_id', subscription.id)

        if (error) {
          console.error('Failed to handle past_due subscription:', error)
        } else {
          console.log(`Subscription ${subscription.id} is ${subscription.status}, removing from team`)
        }
      }
      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
