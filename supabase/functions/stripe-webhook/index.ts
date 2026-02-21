// Stripe webhook handler for TrackRoster
// Handles checkout completion, subscription lifecycle, and trial management

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

      const teamId = session.client_reference_id
      if (!teamId) {
        console.error('No client_reference_id in checkout session')
        break
      }

      const subscriptionId = session.subscription as string | null
      const paymentIntentId = session.payment_intent as string | null

      console.log(`Checkout completed for team: ${teamId}, subscription: ${subscriptionId}`)

      // Check if this subscription has a trial
      let hasTrial = false
      let trialEnd: Date | null = null
      if (subscriptionId) {
        const sub = await stripe.subscriptions.retrieve(subscriptionId)
        if (sub.trial_end) {
          hasTrial = true
          trialEnd = new Date(sub.trial_end * 1000)
        }
      }

      if (hasTrial && trialEnd) {
        // Trial subscription: set subscription ID + update trial_expires_at to match Stripe's trial end
        // Team gets full access during trial (stripe_subscription_id is set = isPaid in useTrialStatus)
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
        // Direct payment (no trial): mark as fully paid
        const { error } = await supabase
          .from('teams')
          .update({
            stripe_subscription_id: subscriptionId || paymentIntentId || `paid_${session.id}`,
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
      break
    }

    case 'invoice.paid': {
      // Fires when trial converts to paid, or on renewal
      const invoice = event.data.object as Stripe.Invoice
      const subscriptionId = invoice.subscription as string | null
      if (!subscriptionId) break

      // Find the team with this subscription
      const { data: team } = await supabase
        .from('teams')
        .select('id')
        .eq('stripe_subscription_id', subscriptionId)
        .single()

      if (team) {
        // Clear trial — they've actually paid now
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
      // Subscription cancelled — remove subscription ID
      // Data is preserved, team goes to expired/view-only state
      const subscription = event.data.object as Stripe.Subscription
      const subId = subscription.id

      const { error } = await supabase
        .from('teams')
        .update({
          stripe_subscription_id: null,
          // Don't set trial_expires_at — they're just expired now
          // Don't set active: false — data stays, just view-only
        })
        .eq('stripe_subscription_id', subId)

      if (error) {
        console.error('Failed to handle subscription deletion:', error)
      } else {
        console.log(`Subscription ${subId} cancelled, team set to view-only`)
      }
      break
    }

    case 'customer.subscription.updated': {
      // Handle trial ending without payment (card declined, etc.)
      const subscription = event.data.object as Stripe.Subscription
      
      if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
        const { error } = await supabase
          .from('teams')
          .update({
            stripe_subscription_id: null, // Remove — they haven't paid
          })
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
