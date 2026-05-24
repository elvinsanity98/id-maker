"use client";

import { FormEvent, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "./AuthProvider";
import { supabase } from "@/lib/supabase";

type Tab = "pay" | "key";

const PRICE = process.env.NEXT_PUBLIC_PREMIUM_PRICE_PHP || "500";
const GCASH_NAME = process.env.NEXT_PUBLIC_GCASH_NAME || "Elvin Jhon";
const GCASH_NUMBER = process.env.NEXT_PUBLIC_GCASH_NUMBER || "0917-XXX-XXXX";
const PAYMENT_EMAIL = process.env.NEXT_PUBLIC_PAYMENT_CONTACT_EMAIL || "you@example.com";
const STOREFRONT = process.env.NEXT_PUBLIC_STOREFRONT_URL || "";

export default function UpgradeModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user, tier, activateLicense } = useAuth();
  const [tab, setTab] = useState<Tab>("pay");
  const [licenseKey, setLicenseKey] = useState("");
  const [activating, setActivating] = useState(false);
  const [activateError, setActivateError] = useState<string | null>(null);
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  if (!open) return null;

  const isPremium = tier === "premium";

  const submitKey = async (e: FormEvent) => {
    e.preventDefault();
    setActivating(true);
    setActivateError(null);
    const { error } = await activateLicense(licenseKey);
    setActivating(false);
    if (error) {
      setActivateError(error);
      return;
    }
    onClose();
  };

  const submitPaymentRequest = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !supabase) {
      setRequestError("Sign in first so we can attach this request to your account.");
      return;
    }
    setSubmitting(true);
    setRequestError(null);
    const { error } = await supabase.from("payment_requests").insert({
      user_id: user.id,
      email: user.email,
      reference: reference.trim() || null,
      notes: notes.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      setRequestError(error.message);
      return;
    }
    setRequestSent(true);
  };

  // Encode a "send" link the GCash app recognizes; on devices without
  // GCash installed the QR is still legible as plain text.
  const qrData = `GCASH:${GCASH_NUMBER};AMOUNT=${PRICE};NOTE=ID Maker Premium`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Upgrade to Premium</h2>
            <p className="text-xs text-slate-500 mt-1">
              One-time payment. No subscription. Keep using your account forever.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {isPremium ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded text-emerald-800">
            <div className="font-bold">You&apos;re already Premium ★</div>
            <p className="text-sm mt-1">
              All templates, palettes, logos, and the watermark-free print are unlocked.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 mb-4">
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-extrabold text-amber-900">₱{PRICE}</div>
                <div className="text-xs text-amber-700">one-time</div>
              </div>
              <ul className="text-xs text-amber-900 mt-3 space-y-1">
                <li>✓ All 4 templates (Blue Wave + 3 premium designs)</li>
                <li>✓ All color palettes per template (19 combinations)</li>
                <li>✓ School logo upload (PNG with transparency)</li>
                <li>✓ Removes the &quot;Made with ID Maker&quot; print watermark</li>
              </ul>
            </div>

            <div className="flex border-b border-slate-200 mb-4">
              <TabBtn active={tab === "pay"} onClick={() => setTab("pay")}>
                1. Pay via GCash
              </TabBtn>
              <TabBtn active={tab === "key"} onClick={() => setTab("key")}>
                2. Enter license key
              </TabBtn>
            </div>

            {tab === "pay" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
                  <div className="bg-white p-2 border-2 border-blue-600 rounded">
                    <QRCodeSVG value={qrData} size={140} level="M" />
                  </div>
                  <div className="text-sm text-slate-700 space-y-1">
                    <div>
                      <span className="text-slate-500">Send to:</span>{" "}
                      <span className="font-semibold">{GCASH_NAME}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">GCash:</span>{" "}
                      <span className="font-mono font-semibold">{GCASH_NUMBER}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Amount:</span>{" "}
                      <span className="font-semibold">₱{PRICE}</span>
                    </div>
                    <div className="text-xs text-slate-500 pt-2">
                      The QR encodes the payment hint above. Scan with the GCash app or send
                      manually to the number.
                    </div>
                  </div>
                </div>

                {STOREFRONT && (
                  <a
                    href={STOREFRONT}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center text-sm text-blue-600 underline"
                  >
                    Or pay with credit card via Gumroad →
                  </a>
                )}

                <form onSubmit={submitPaymentRequest} className="space-y-3 border-t pt-4">
                  <div className="text-sm font-semibold text-slate-800">
                    After paying, submit your reference
                  </div>
                  <p className="text-xs text-slate-500">
                    {user
                      ? "We&apos;ll email a license key to your account address within 24 hours."
                      : "Sign in first so we can email the license key to your account address."}
                  </p>
                  <input
                    type="text"
                    placeholder="GCash reference number (e.g. 1234567890123)"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    required
                    disabled={!user || requestSent}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  />
                  <textarea
                    placeholder="Optional notes (sender name, time, etc.)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    disabled={!user || requestSent}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  />
                  {requestError && (
                    <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">
                      {requestError}
                    </div>
                  )}
                  {requestSent ? (
                    <div className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded p-3">
                      ✓ Request submitted. You&apos;ll receive your license key at{" "}
                      <strong>{user?.email}</strong> within 24 hours. Questions? Email{" "}
                      <a href={`mailto:${PAYMENT_EMAIL}`} className="underline">
                        {PAYMENT_EMAIL}
                      </a>
                      .
                    </div>
                  ) : (
                    <button
                      type="submit"
                      disabled={!user || submitting}
                      className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {submitting ? "Submitting…" : "Submit payment proof"}
                    </button>
                  )}
                </form>
              </div>
            )}

            {tab === "key" && (
              <form onSubmit={submitKey} className="space-y-3">
                <p className="text-sm text-slate-600">
                  Paste the license key you received by email after your GCash payment was confirmed.
                </p>
                <input
                  type="text"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  placeholder="IDMK-XXXX-XXXX-XXXX-CCCC"
                  required
                  autoFocus
                  className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {activateError && (
                  <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">
                    {activateError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={activating || !user}
                  className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {activating ? "Activating…" : "Activate Premium"}
                </button>
                {!user && (
                  <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                    Sign in first — we activate Premium on your account, not on this device.
                  </div>
                )}
                <div className="text-[11px] text-slate-400 text-center pt-2">
                  Demo key for testing: <code>IDMK-DEMO-2026-FREE-TEST</code>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 px-3 py-2 text-sm font-semibold transition border-b-2 ${
        active
          ? "text-blue-600 border-blue-600"
          : "text-slate-500 border-transparent hover:text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}
