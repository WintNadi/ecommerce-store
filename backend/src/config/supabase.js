import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
    },
  }
);

export const BUCKET_NAME = process.env.SUPABASE_BUCKET_NAME;
export const PUBLIC_URL = process.env.SUPABASE_PUBLIC_URL;

console.log('✅ Supabase Storage configured successfully');
console.log(`📦 Bucket: ${BUCKET_NAME}`);
console.log(`🔗 URL: ${PUBLIC_URL}`);