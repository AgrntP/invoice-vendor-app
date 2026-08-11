// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Retrieve keys from environment variables (Next.js format)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

// Create and export a single shared client instance
export const supabase = createClient(supabaseUrl, supabasePublishableKey);