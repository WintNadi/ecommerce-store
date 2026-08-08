import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

// ✅ Stripe Key ရှိမရှိစစ်ပါ
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY is not set in environment variables');
  process.exit(1);
}

// ✅ API Version ကို 2026-07-29.dahlia လို့ပြောင်းပါ
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-07-29.dahlia',
});

console.log('✅ Stripe initialized successfully');

export default stripe;