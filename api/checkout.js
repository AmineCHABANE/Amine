import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const PLANS = {
  pro: {
    name: 'AmineAPI Pro',
    credits: 50000,
    price_cents: 1900, // $19
    description: '50,000 requests/month · 100 req/min · Email support',
  },
  enterprise: {
    name: 'AmineAPI Enterprise',
    credits: 500000,
    price_cents: 9900, // $99
    description: 'Unlimited requests · No rate limit · Slack support + SLA',
  },
  credits_2k: {
    name: '2,000 Credits Pack',
    credits: 2000,
    price_cents: 200, // $2
    description: '2,000 one-time credits top-up',
  },
  credits_5k: {
    name: '5,000 Credits Pack',
    credits: 5000,
    price_cents: 500, // $5
    description: '5,000 one-time credits top-up',
  },
  credits_25k: {
    name: '25,000 Credits Pack',
    credits: 25000,
    price_cents: 1500, // $15
    description: '25,000 one-time credits top-up',
  },
  credits_100k: {
    name: '100,000 Credits Pack',
    credits: 100000,
    price_cents: 4900, // $49
    description: '100,000 one-time credits top-up — best value',
  },
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).setHeader('Access-Control-Allow-Origin', '*').end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));

  try {
    const { plan_id, user_id, user_email } = req.body || {};

    if (!plan_id || !user_id || !user_email) {
      return res.status(400).json({ error: 'Missing plan_id, user_id, or user_email' });
    }

    // Verify user exists in database (prevents spoofed user_ids)
    const { data: userProfile, error: profileErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user_id)
      .single();
    if (profileErr || !userProfile) {
      return res.status(403).json({ error: 'Invalid user' });
    }

    const plan = PLANS[plan_id];
    if (!plan) {
      return res.status(400).json({ error: `Invalid plan. Choose: ${Object.keys(PLANS).join(', ')}` });
    }

    // Get or create Stripe customer
    let stripe_customer_id;
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user_id)
      .single();

    if (profile?.stripe_customer_id) {
      stripe_customer_id = profile.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user_email,
        metadata: { supabase_user_id: user_id },
      });
      stripe_customer_id = customer.id;
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customer.id })
        .eq('id', user_id);
    }

    // Determine mode: subscription for pro/enterprise, payment for credit packs
    const isSubscription = plan_id === 'pro' || plan_id === 'enterprise';

    const sessionConfig = {
      customer: stripe_customer_id,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: plan.price_cents,
          product_data: {
            name: plan.name,
            description: plan.description,
          },
          ...(isSubscription ? { recurring: { interval: 'month' } } : {}),
        },
        quantity: 1,
      }],
      mode: isSubscription ? 'subscription' : 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://api-amine.vercel.app'}?checkout=success&plan=${plan_id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://api-amine.vercel.app'}?checkout=cancelled`,
      metadata: {
        user_id,
        plan_id,
        credits: plan.credits.toString(),
      },
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return res.status(200).json({ url: session.url, session_id: session.id });
  } catch (e) {
    console.error('[AmineAPI] checkout error:', e);
    return res.status(500).json({ error: 'Failed to create checkout session', details: e.message });
  }
}
