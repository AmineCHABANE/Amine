import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Vercel serverless needs raw body for signature verification
export const config = {
  api: { bodyParser: false },
};

async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const rawBody = await getRawBody(req);
    const sig = req.headers['stripe-signature'];

    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('[Webhook] Signature verification failed:', err.message);
      return res.status(400).json({ error: 'Webhook signature verification failed' });
    }

    console.log(`[Webhook] Received: ${event.type}`);

    switch (event.type) {
      // ─── One-time payment completed (credit packs) ───
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { user_id, plan_id, credits } = session.metadata;

        if (!user_id || !credits) break;

        const creditAmount = parseInt(credits, 10);

        if (plan_id === 'pro' || plan_id === 'enterprise') {
          // Subscription: update plan + add monthly credits
          await supabase
            .from('profiles')
            .update({
              plan: plan_id,
              credits: creditAmount,
              stripe_subscription_id: session.subscription,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user_id);
        } else {
          // One-time credit pack: just add credits
          await supabase.rpc('increment_credits', {
            user_id_input: user_id,
            amount: creditAmount,
          });
        }

        // Log the transaction
        await supabase.from('payment_logs').insert([{
          user_id,
          stripe_session_id: session.id,
          plan_id,
          amount_cents: session.amount_total,
          credits_granted: creditAmount,
          status: 'completed',
        }]);

        console.log(`[Webhook] ✅ ${plan_id}: +${creditAmount} credits for user ${user_id}`);
        break;
      }

      // ─── Subscription renewed (monthly invoice paid) ───
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        if (invoice.billing_reason !== 'subscription_cycle') break;

        const customerId = invoice.customer;
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, plan')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!profile) break;

        const monthlyCredits = profile.plan === 'enterprise' ? 500000 : 50000;
        await supabase
          .from('profiles')
          .update({ credits: monthlyCredits, updated_at: new Date().toISOString() })
          .eq('id', profile.id);

        console.log(`[Webhook] ✅ Subscription renewed: +${monthlyCredits} credits for ${profile.id}`);
        break;
      }

      // ─── Payment failed ───
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ plan: 'free', updated_at: new Date().toISOString() })
            .eq('id', profile.id);
          console.log(`[Webhook] ⚠️ Payment failed, downgraded user ${profile.id} to free`);
        }
        break;
      }

      // ─── Subscription cancelled ───
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({
              plan: 'free',
              stripe_subscription_id: null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', profile.id);
          console.log(`[Webhook] ❌ Subscription cancelled for user ${profile.id}`);
        }
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (e) {
    console.error('[Webhook] Error:', e);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
}
