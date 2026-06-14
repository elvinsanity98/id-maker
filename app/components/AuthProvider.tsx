"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase, type Profile } from "@/lib/supabase";
import { validateLicense } from "@/lib/license";

export type Tier = "free" | "premium";

/**
 * Race a promise against a timeout. Supabase requests to a paused / offline
 * project can hang the socket indefinitely; this guarantees we reject with a
 * clear error after `ms` instead of leaving the UI stuck on "Working…".
 */
function withTimeout<T>(promise: PromiseLike<T>, ms = 15000): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms)
    ),
  ]);
}

/** Turn a thrown/rejected auth error into a user-facing message. */
function describeNetworkError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg === "timeout") {
    return "The server didn't respond. Your Supabase project may be paused (free projects pause after ~1 week idle) — open the Supabase dashboard to resume it, then try again.";
  }
  if (/fetch|network|Failed to fetch/i.test(msg)) {
    return "Couldn't reach the auth server. Check your connection, or your Supabase project may be paused — resume it from the dashboard and retry.";
  }
  return msg || "Something went wrong while signing in. Please try again.";
}

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

    // Fast path: the row exists from the on-signup trigger.
    const fast = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (fast.data) return fast.data as Profile;
    if (fast.error) console.warn("[auth] profile fetch failed:", fast.error.message);

    // Slow path: backfill via SECURITY DEFINER RPC. Handles users who
    // signed up before the on-signup trigger was installed.
    const ensured = await supabase.rpc("ensure_profile");
    if (ensured.error) {
      console.warn("[auth] ensure_profile failed:", ensured.error.message);
      return null;
    }
    return ensured.data as Profile;
  }, []);

  const refresh = useCallback(async () => {
    if (!supabase) {
      setLoaded(true);
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setUser(profile);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("[auth] refresh failed:", err);
      setUser(null);
    } finally {
      // Always flip loaded so the UI never gets stuck on the loading state.
      setLoaded(true);
    }
  }, [fetchProfile]);

  useEffect(() => {
    refresh();

    // Belt-and-suspenders: if anything upstream (network stall, hung
    // SDK init, etc.) prevents refresh() from flipping `loaded`, this
    // guarantees the UI gets out of the loading state after 5s. The
    // worst case is a brief "Sign in" button when the user is already
    // signed in — they can click it and the SDK reconciles.
    const safety = setTimeout(() => setLoaded(true), 5000);

    if (!supabase) return () => clearTimeout(safety);
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setUser(profile);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("[auth] state-change handler failed:", err);
        setUser(null);
      }
    });
    return () => {
      clearTimeout(safety);
      sub.subscription.unsubscribe();
    };
  }, [refresh, fetchProfile]);

  const signUp: AuthContextValue["signUp"] = useCallback(async (email, password, fullName) => {
    if (!supabase) return { error: "Auth is not configured. Add Supabase env vars." };
    // Use the origin the user signed up from so the confirmation email
    // returns them to the same deployment (localhost in dev, Vercel in
    // prod). Without this Supabase falls back to its Site URL setting,
    // which defaults to localhost:3000 — fine for testing, wrong in prod.
    const emailRedirectTo =
      typeof window !== "undefined" ? window.location.origin : undefined;
    try {
      const { error } = await withTimeout(
        supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName }, emailRedirectTo },
        })
      );
      if (error) return { error: error.message };
      await refresh();
      return {};
    } catch (err) {
      return { error: describeNetworkError(err) };
    }
  }, [refresh]);

  const signIn: AuthContextValue["signIn"] = useCallback(async (email, password) => {
    if (!supabase) return { error: "Auth is not configured. Add Supabase env vars." };
    try {
      const { error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password })
      );
      if (error) return { error: error.message };
      await refresh();
      return {};
    } catch (err) {
      return { error: describeNetworkError(err) };
    }
  }, [refresh]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const activateLicense: AuthContextValue["activateLicense"] = useCallback(async (rawKey) => {
    if (!supabase || !user) return { error: "Please sign in before activating a license." };
    const key = rawKey.trim().toUpperCase();

    // 1. Fast client-side format/HMAC sanity check — avoids round-tripping
    //    obvious garbage to the database.
    const ok = await validateLicense(key);
    if (!ok) return { error: "That license key isn't a valid format." };

    // 2. Atomic redeem on the server. The RPC enforces one-account-per-key:
    //    it checks the key exists, isn't revoked, isn't already claimed by
    //    a different account, then flips status='used' and bumps the
    //    caller's profile to premium — all in one transaction.
    const { data, error } = await supabase.rpc("activate_license_key", { input_key: key });
    if (error) return { error: error.message };

    const result = data as { ok: boolean; message: string } | null;
    if (!result) return { error: "Unexpected empty response from server." };
    if (!result.ok) return { error: result.message };

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
