import { createClient } from '@supabase/supabase-js';

const supabaseDirectUrl = import.meta.env.VITE_SUPABASE_URL; // e.g. https://hkdyivuauoxrmysowhvs.supabase.co
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// ─── Jio / ISP workaround ───
// Some Indian ISPs (Jio, BSNL, etc.) block direct connections to supabase.co.
// In production we route ALL Supabase traffic through a Netlify reverse proxy
// (/supabase/* → hkdyivuauoxrmysowhvs.supabase.co/*) so the browser only
// ever talks to canteenq.netlify.app, which ISPs do NOT block.
const isProduction = import.meta.env.PROD;

// In production: use the current origin + /supabase as the base URL
// In development: use the direct Supabase URL (no ISP issues on localhost)
const supabaseUrl = isProduction
    ? `${window.location.origin}/supabase`
    : supabaseDirectUrl;

// Standard client (subject to Row Level Security)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client (bypasses Row Level Security) - exclusively for tables like Notifications
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);