"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase, type Profile } from "@/lib/supabase";
import { validateLicense } from "@/lib/license";

export type Tier = "free" | "premium";

type AuthContextValue = {
  user: Profile | null;
  /** True once we've completed the initial session check, regardless of result. */
  loaded: boolean;
  /** True when Supabase env vars are present and the client constructed. */
  configured: boolean;
  tier: Tier;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  /** Validates the key, and if valid, marks the current profile premium. */
  activateLicense: (key: string) => Promise<{ error?: string }>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const configured = isSupabaseConfigured();

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) {
      console.warn("[auth] profile fetch failed:", error.message);
      return null;
    }
    return data as Profile;
  }, []);

  const refresh = useCallback(async () => {
    if (!supabase) {
      setLoaded(true);
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const profile = await fetchProfile(session.user.id);
      setUser(profile);
    } else {
      setUser(null);
    }
    setLoaded(true);
  }, [fetchProfile]);

  useEffect(() => {
    refresh();
    if (!supabase) return;
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setUser(profile);
      } else {
        setUser(null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [refresh, fetchProfile]);

  const signUp: AuthContextValue["signUp"] = useCallback(async (email, password, fullName) => {
    if (!supabase) return { error: "Auth is not configured. Add Supabase env vars." };
    // Use the origin the user signed up from so the confirmation email
    // returns them to the same deployment (localhost in dev, Vercel in
    // prod). Without this Supabase falls back to its Site URL setting,
    // which defaults to localhost:3000 — fine for testing, wrong in prod.
    const emailRedirectTo =
      typeof window !== "undefined" ? window.location.origin : undefined;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo,
      },
    });
    if (error) return { error: error.message };
    await refresh();
    return {};
  }, [refresh]);

  const signIn: AuthContextValue["signIn"] = useCallback(async (email, password) => {
    if (!supabase) return { error: "Auth is not configured. Add Supabase env vars." };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    await refresh();
    return {};
  }, [refresh]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const activateLicense: AuthContextValue["activateLicense"] = useCallback(async (rawKey) => {
    if (!supabase || !user) return { error: "Please sign in before activating a license." };
    const key = rawKey.trim().toUpperCase();
    const ok = await validateLicense(key);
    if (!ok) return { error: "That license key isn't valid. Double-check the format." };

    const { error } = await supabase
      .from("profiles")
      .update({
        tier: "premium",
        license_key: key,
        activated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    if (error) return { error: error.message };
    await refresh();
    return {};
  }, [user, refresh]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loaded,
      configured,
      tier: user?.tier ?? "free",
      signUp,
      signIn,
      signOut,
      activateLicense,
      refresh,
    }),
    [user, loaded, configured, signUp, signIn, signOut, activateLicense, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
