"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "../components/AuthProvider";
import AttendanceReport from "../components/AttendanceReport";
import { findStudentByLrn } from "@/lib/students";
import {
  listAttendance,
  logAttendance,
  normalizeScan,
  type AttendanceRow,
} from "@/lib/attendance";
import {
  computeStatus,
  getOrgSettings,
  listOrgs,
  saveOrgSettings,
  type OrgSettings,
} from "@/lib/orgSettings";

type Mode = "camera" | "scanner";
type AttEvent = "in" | "out";

type Feedback = {
  ok: boolean;
  title: string;
  detail: string;
} | null;

export default function AttendancePage() {
  const { user, tier, loaded } = useAuth();
  const [tab, setTab] = useState<"scan" | "report">("scan");
  const [mode, setMode] = useState<Mode>("camera");
  const [event, setEvent] = useState<AttEvent>("in");
  const [orgs, setOrgs] = useState<string[]>([]);
  const [org, setOrg] = useState<string>("");
  const [settings, setSettings] = useState<OrgSettings>({
    org: "",
    late_after_in: "08:00",
    late_after_out: "17:00",
  });
  const [savingCfg, setSavingCfg] = useState(false);
  const [cfgSaved, setCfgSaved] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [countdown, setCountdown] = useState(0);
  const [recent, setRecent] = useState<AttendanceRow[]>([]);
  const [scanning, setScanning] = useState(false);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [cameraId, setCameraId] = useState<string>("");
  const scannerRef = useRef<unknown>(null);
  const wedgeRef = useRef<HTMLInputElement>(null);
  // Guard against the same code firing many times while the QR sits in frame.
  const lastScanRef = useRef<{ code: string; at: number }>({ code: "", at: 0 });

  const refreshRecent = useCallback(async () => {
    const { data } = await listAttendance(30);
    setRecent(data);
  }, []);

  useEffect(() => {
    if (user && tier === "premium") refreshRecent();
  }, [user, tier, refreshRecent]);

  // Load the org list (distinct school names from the roster).
  useEffect(() => {
    if (!user || tier !== "premium") return;
    listOrgs().then((list) => {
      setOrgs(list);
      setOrg((cur) => cur || list[0] || "");
    });
  }, [user, tier]);

  // Load per-org cutoff settings whenever the active org changes.
  useEffect(() => {
    if (!org) return;
    getOrgSettings(org).then(setSettings);
    setCfgSaved(false);
  }, [org]);

  const saveCfg = useCallback(async () => {
    if (!user || !org) return;
    setSavingCfg(true);
    await saveOrgSettings(user.id, settings);
    setSavingCfg(false);
    setCfgSaved(true);
    setTimeout(() => setCfgSaved(false), 1800);
  }, [user, org, settings]);

  // Popup countdown: when a result arrives, tick 3 -> 0 then auto-dismiss.
  useEffect(() => {
    if (!feedback) return;
    setCountdown(3);
    const tick = setInterval(() => {
      setCountdown((n) => {
        if (n <= 1) {
          clearInterval(tick);
          setFeedback(null);
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [feedback]);

  // ─── core: resolve a scanned code against the roster + log it ──
  const handleCode = useCallback(
    async (raw: string, source: "camera" | "scanner") => {
      if (!user) return;
      const lrn = normalizeScan(raw);
      const now = Date.now();
      // Debounce identical reads within 3s (camera streams repeats).
      if (lastScanRef.current.code === lrn && now - lastScanRef.current.at < 3000) return;
      lastScanRef.current = { code: lrn, at: now };

      const { student, error } = await findStudentByLrn(lrn, org || undefined);
      if (error) {
        setFeedback({ ok: false, title: "Lookup failed", detail: error });
        return;
      }
      if (!student) {
        setFeedback({
          ok: false,
          title: "Not found",
          detail: `No student with LRN ${lrn}${org ? ` in ${org}` : ""}. Save them as a draft first.`,
        });
        return;
      }
      // Auto-decide on-time vs late from the org's cutoff for this event.
      const computed = computeStatus(settings, event);
      const { error: logErr } = await logAttendance(
        user.id,
        student.lrn,
        student.name,
        computed,
        event,
        org || student.school || null,
        source
      );
      if (logErr) {
        setFeedback({ ok: false, title: "Could not log", detail: logErr });
        return;
      }
      const evLabel = event === "in" ? "TIME IN" : "TIME OUT";
      setFeedback({
        ok: computed === "on-time",
        title: `${student.name ?? student.lrn}`,
        detail: `${evLabel} · ${computed.toUpperCase()} · ${new Date().toLocaleTimeString()}`,
      });
      refreshRecent();
    },
    [user, org, event, settings, refreshRecent]
  );

  // ─── camera scanner (html5-qrcode, lazy-loaded) ────────────────
  const startCamera = useCallback(async () => {
    setFeedback(null);
    const { Html5Qrcode } = await import("html5-qrcode");
    try {
      const devices = await Html5Qrcode.getCameras();
      setCameras(devices.map((d) => ({ id: d.id, label: d.label || d.id })));
      const useId = cameraId || devices[devices.length - 1]?.id;
      if (!useId) {
        setFeedback({ ok: false, title: "No camera", detail: "No camera device found." });
        return;
      }
      setCameraId(useId);
      const inst = new Html5Qrcode("qr-reader");
      scannerRef.current = inst;
      await inst.start(
        useId,
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decoded: string) => handleCode(decoded, "camera"),
        () => {}
      );
      setScanning(true);
    } catch (err) {
      setFeedback({
        ok: false,
        title: "Camera error",
        detail: err instanceof Error ? err.message : "Could not start camera. Grant permission and use HTTPS.",
      });
    }
  }, [cameraId, handleCode]);

  const stopCamera = useCallback(async () => {
    const inst = scannerRef.current as { stop: () => Promise<void>; clear: () => void } | null;
    if (inst) {
      try {
        await inst.stop();
        inst.clear();
      } catch {
        /* already stopped */
      }
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  // Stop camera on unmount or when leaving camera mode.
  useEffect(() => {
    if (mode !== "camera") stopCamera();
    return () => {
      stopCamera();
    };
  }, [mode, stopCamera]);

  // Keep the hidden wedge input focused in scanner mode.
  useEffect(() => {
    if (mode === "scanner") wedgeRef.current?.focus();
  }, [mode]);

  // ─── gating ────────────────────────────────────────────────────
  if (!loaded) {
    return <Shell><p className="text-slate-500">Loading…</p></Shell>;
  }
  if (!user) {
    return (
      <Shell>
        <Gate
          title="Sign in required"
          body="Attendance scanning runs on your account roster. Sign in from the home page first."
        />
      </Shell>
    );
  }
  if (tier !== "premium") {
    return (
      <Shell>
        <Gate
          title="★ Premium feature"
          body="QR attendance scanning is part of Premium. Upgrade from the home page to unlock it."
        />
      </Shell>
    );
  }

  return (
    <Shell>
      {/* Scanner / Report tabs */}
      <div className="no-print flex gap-2 mb-4">
        <TabBtn active={tab === "scan"} onClick={() => setTab("scan")}>Scanner</TabBtn>
        <TabBtn active={tab === "report"} onClick={() => setTab("report")}>Report</TabBtn>
      </div>

      {tab === "report" ? (
        <AttendanceReport />
      ) : (
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="bg-white rounded-xl shadow-sm p-5">
          {/* Organization selector + cutoff settings */}
          <div className="mb-4 p-3 rounded-lg border border-slate-200 bg-slate-50">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Organization / School
            </label>
            {orgs.length === 0 ? (
              <p className="text-xs text-amber-700">
                No schools yet. Save a card draft (with a School Name + LRN) to
                build your roster.
              </p>
            ) : (
              <select
                value={org}
                onChange={(e) => setOrg(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white text-slate-900"
              >
                {orgs.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            )}

            {org && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="text-[11px] font-medium text-slate-600">
                  On-time until (Time In)
                  <input
                    type="time"
                    value={settings.late_after_in}
                    onChange={(e) => setSettings((s) => ({ ...s, late_after_in: e.target.value }))}
                    className="w-full mt-1 px-2 py-1.5 border border-slate-300 rounded-md text-sm bg-white text-slate-900"
                  />
                </label>
                <label className="text-[11px] font-medium text-slate-600">
                  On-time until (Time Out)
                  <input
                    type="time"
                    value={settings.late_after_out}
                    onChange={(e) => setSettings((s) => ({ ...s, late_after_out: e.target.value }))}
                    className="w-full mt-1 px-2 py-1.5 border border-slate-300 rounded-md text-sm bg-white text-slate-900"
                  />
                </label>
                <div className="col-span-2 flex items-center gap-2">
                  <button
                    onClick={saveCfg}
                    disabled={savingCfg}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    {savingCfg ? "Saving…" : "Save cutoff times"}
                  </button>
                  {cfgSaved && <span className="text-[11px] text-emerald-700 font-semibold">✓ Saved</span>}
                  <span className="text-[10px] text-slate-400">
                    Scan ≤ cutoff = on-time, else late.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Device + Time In/Out controls */}
          <div className="flex flex-wrap gap-3 items-center mb-4">
            <div className="inline-flex rounded-md border border-slate-300 overflow-hidden">
              <ModeBtn active={mode === "camera"} onClick={() => setMode("camera")}>📷 Camera</ModeBtn>
              <ModeBtn active={mode === "scanner"} onClick={() => setMode("scanner")}>🔌 Hardware scanner</ModeBtn>
            </div>
            <div className="inline-flex rounded-md border border-slate-300 overflow-hidden">
              <ModeBtn active={event === "in"} onClick={() => setEvent("in")}>⬇ Time In</ModeBtn>
              <ModeBtn active={event === "out"} onClick={() => setEvent("out")}>⬆ Time Out</ModeBtn>
            </div>
          </div>

          {mode === "camera" ? (
            <div>
              {cameras.length > 1 && (
                <select
                  value={cameraId}
                  onChange={(e) => setCameraId(e.target.value)}
                  className="w-full mb-3 px-3 py-2 border border-slate-300 rounded-md text-sm bg-white text-slate-900"
                >
                  {cameras.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              )}
              <div
                id="qr-reader"
                className="w-full max-w-sm mx-auto rounded-lg overflow-hidden bg-slate-900"
                style={{ minHeight: 240 }}
              />
              <div className="flex gap-2 justify-center mt-3">
                {!scanning ? (
                  <button onClick={startCamera} className="px-4 py-2 bg-emerald-600 text-white rounded-md font-semibold hover:bg-emerald-700">
                    Start camera
                  </button>
                ) : (
                  <button onClick={stopCamera} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md font-semibold hover:bg-slate-300">
                    Stop
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-slate-600 mb-2">
                Click the box, then scan with your USB/Bluetooth scanner. Most
                act as a keyboard and send the code followed by Enter.
              </p>
              <input
                ref={wedgeRef}
                type="text"
                autoFocus
                placeholder="Waiting for scan…"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const val = (e.target as HTMLInputElement).value;
                    if (val.trim()) handleCode(val, "scanner");
                    (e.target as HTMLInputElement).value = "";
                  }
                }}
                className="w-full px-4 py-3 border-2 border-dashed border-emerald-400 rounded-lg text-center text-lg bg-emerald-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

        </section>

        {/* Recent scans */}
        <aside className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-800">Recent</h2>
            <button onClick={refreshRecent} className="text-xs text-blue-600 underline">Refresh</button>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No scans yet.</p>
          ) : (
            <ul className="space-y-1.5 max-h-[60vh] overflow-y-auto">
              {recent.map((r) => (
                <li key={r.id} className="flex items-center justify-between px-2 py-1.5 bg-slate-50 rounded border border-slate-200">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{r.student_name ?? r.student_lrn}</div>
                    <div className="text-[10px] text-slate-400">
                      {r.event === "out" ? "Out" : "In"} · {new Date(r.scanned_at).toLocaleString()}
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    r.status === "on-time" || r.status === "present"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                    {r.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
      )}

      {feedback && (
        <ResultPopup feedback={feedback} countdown={countdown} onClose={() => setFeedback(null)} />
      )}
    </Shell>
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
      onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold rounded-md border transition ${
        active
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

function ResultPopup({
  feedback,
  countdown,
  onClose,
}: {
  feedback: NonNullable<Feedback>;
  countdown: number;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-sm rounded-2xl shadow-2xl p-8 text-center border-4 ${
          feedback.ok
            ? "bg-emerald-50 border-emerald-500"
            : "bg-red-50 border-red-500"
        }`}
        style={{ animation: "popIn 0.18s ease-out" }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-slate-400 hover:text-slate-700 text-2xl leading-none"
          aria-label="Close"
        >
          &times;
        </button>

        <div
          className={`mx-auto mb-3 w-20 h-20 rounded-full flex items-center justify-center text-5xl text-white ${
            feedback.ok ? "bg-emerald-500" : "bg-red-500"
          }`}
        >
          {feedback.ok ? "✓" : "✕"}
        </div>

        <div
          className={`text-xl font-extrabold mb-1 ${
            feedback.ok ? "text-emerald-900" : "text-red-900"
          }`}
        >
          {feedback.title}
        </div>
        <div className="text-sm text-slate-600 mb-4">{feedback.detail}</div>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <span
            className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-white ${
              feedback.ok ? "bg-emerald-500" : "bg-red-500"
            }`}
          >
            {countdown}
          </span>
          <span>closing in {countdown}s</span>
        </div>
      </div>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="bg-gradient-to-br from-blue-600 to-blue-900 text-white py-3 px-4 sm:px-8 shadow">
        <div className="max-w-[1500px] mx-auto flex items-center justify-between">
          <h1 className="text-lg sm:text-2xl font-bold">Attendance Scanner</h1>
          <Link href="/" className="text-sm font-semibold border border-white/40 rounded-md px-3 py-1.5 hover:bg-white/10">
            ← Back to ID Maker
          </Link>
        </div>
      </header>
      <main className="max-w-[1500px] mx-auto p-4 sm:p-6">{children}</main>
    </>
  );
}

function Gate({ title, body }: { title: string; body: string }) {
  return (
    <div className="max-w-md mx-auto mt-12 bg-white rounded-xl shadow-sm p-6 text-center">
      <h2 className="text-xl font-bold text-slate-900 mb-2">{title}</h2>
      <p className="text-slate-600 mb-4">{body}</p>
      <Link href="/" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700">
        Go to home
      </Link>
    </div>
  );
}

function ModeBtn({
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
      onClick={onClick}
      className={`px-3 py-2 text-sm font-semibold ${
        active ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}
