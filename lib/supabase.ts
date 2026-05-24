"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * The Supabase client is null when env vars aren't configured (e.g. local
 * dev without a .env.local). Consumers must check `isSupabaseConfigured()`
 * before calling — the app should still work in "anonymous free tier" mode
 * even when the backend is missing.
 */
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  tier: "free" | "premium";
  license_key: string | null;
  activated_at: string | null;
  created_at: string;
};
