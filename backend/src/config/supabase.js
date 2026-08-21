import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import https from 'https';
import http from 'http';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const bucketName = process.env.SUPABASE_BUCKET_NAME || 'products';

// Check credentials
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials not found!');
  console.error('   SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error('   SUPABASE_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');
} else {
  console.log('✅ Supabase configured:', supabaseUrl);
  console.log(`📦 Bucket: ${bucketName}`);
}

// ============================================
// ✅ CUSTOM FETCH WITH TIMEOUT & AGENT
// ============================================

const customFetch = (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
    console.error('❌ Supabase request timeout after 30s');
  }, 30000); // 30 seconds timeout

  // Use HTTP/HTTPS agent for better connection handling
  const isHttps = url.startsWith('https://');
  const agent = isHttps
    ? new https.Agent({
        keepAlive: true,
        keepAliveMsecs: 1000,
        maxSockets: 10,
        maxFreeSockets: 5,
        timeout: 30000,
        rejectUnauthorized: true,
      })
    : new http.Agent({
        keepAlive: true,
        keepAliveMsecs: 1000,
        maxSockets: 10,
        maxFreeSockets: 5,
        timeout: 30000,
      });

  return fetch(url, {
    ...options,
    agent,
    signal: controller.signal,
  })
    .finally(() => clearTimeout(timeoutId))
    .catch((err) => {
      console.error('❌ Fetch error:', err.message);
      throw err;
    });
};

// ============================================
// ✅ CREATE SUPABASE CLIENT
// ============================================

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    fetch: customFetch,
  },
});

// ============================================
// ✅ EXPORT CONSTANTS
// ============================================

export const BUCKET_NAME = bucketName;
export const PUBLIC_URL = process.env.SUPABASE_PUBLIC_URL || supabaseUrl;

console.log('✅ Supabase Storage configured successfully');
console.log(`📦 Bucket: ${BUCKET_NAME}`);
console.log(`🔗 URL: ${PUBLIC_URL}`);