import Stripe from 'stripe';

export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder',
  { typescript: true },
);

// Re-export the client-safe plan catalogue so server modules can keep importing
// plan data + the Stripe client from a single place.
export * from './plans';
