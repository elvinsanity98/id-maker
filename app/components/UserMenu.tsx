"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";
import AuthModal from "./AuthModal";

export default function UserMenu({ onUpgradeClick }: { onUpgradeClick: () => void }) {
  const { user, tier, loaded, signOut } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [menuOpen, setMenuOpen] = useState(false);

  // When we don't yet have a user object (still loading, or genuinely
  // signed-out), render the sign-in / sign-up affordance. This is the
  // critical guarantee: there is ALWAYS a way to authenticate, even
  // if the profile fetch is hanging or returned null unexpectedly.
  if (!user) {
    return (
      <>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setAuthMode("signin");
              setAuthOpen(true);
            }}
            className="px-3 py-1.5 text-sm font-semibold text-white border border-white/40 rounded-md hover:bg-white/10 transition"
            aria-busy={!loaded}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode("signup");
              setAuthOpen(true);
            }}
            className="px-3 py-1.5 text-sm font-semibold text-blue-700 bg-white rounded-md hover:bg-slate-100 transition"
            aria-busy={!loaded}
          >
            Sign up
          </button>
        </div>
        <AuthModal open={authOpen} initialMode={authMode} onClose={() => setAuthOpen(false)} />
      </>
    );
  }

  const displayName = user.full_name || user.email.split("@")[0];

  return (
    <div className="relative flex items-center gap-2">
      {tier === "free" && (
        <button
          type="button"
          onClick={onUpgradeClick}
          className="px-3 py-1.5 text-xs font-bold rounded-md bg-amber-400 text-amber-950 hover:bg-amber-300 transition"
        >
          ★ Upgrade
        </button>
      )}
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-white/10 transition"
      >
        <div className="w-7 h-7 rounded-full bg-white text-blue-700 flex items-center justify-center font-bold text-sm">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div className="text-left hidden sm:block">
          <div className="text-sm font-semibold text-white leading-tight">{displayName}</div>
          <div className="text-[10px] text-white/80 leading-tight uppercase tracking-wider">
            {tier === "premium" ? "★ Premium" : "Free"}
          </div>
        </div>
        <span className="text-white/70 text-xs">▾</span>
      </button>
      {menuOpen && (
        <>
          {/* click-outside catcher */}
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-md shadow-lg border border-slate-200 z-50 overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-100">
              <div className="text-xs text-slate-500">Signed in as</div>
              <div className="text-sm font-medium text-slate-800 truncate">{user.email}</div>
              <div className="mt-1">
                <span
                  className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    tier === "premium"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tier === "premium" ? "★ Premium" : "Free tier"}
                </span>
              </div>
            </div>
            {tier === "free" && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onUpgradeClick();
                }}
                className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Upgrade to Premium
              </button>
            )}
            <button
              type="button"
              onClick={async () => {
                setMenuOpen(false);
                await signOut();
              }}
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
