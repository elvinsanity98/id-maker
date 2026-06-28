"use client";

import { supabase } from "./supabase";

export type AttStatus = "on-time" | "late" | "present" | "absent";
export type AttEvent = "in" | "out";

export type AttendanceRow = {
  id: string;
  owner_id: string;
  student_lrn: string;
  student_name: string | null;
  status: AttStatus;
  event: AttEvent;
  org: string | null;
  source: string | null;
  scanned_at: string;
};

export async function logAttendance(
  ownerId: string,
  studentLrn: string,
  studentName: string | null,
  status: AttStatus,
  event: AttEvent,
  org: string | null,
  source: "camera" | "scanner"
): Promise<{ row?: AttendanceRow; error?: string }> {
  if (!supabase) return { error: "Supabase not configured." };
  const { data, error } = await supabase
    .from("attendance")
    .insert({
      owner_id: ownerId,
      student_lrn: studentLrn,
      student_name: studentName,
      status,
      event,
      org,
      source,
    })
    .select("*")
    .single();
  if (error) return { error: error.message };
  return { row: data as AttendanceRow };
}

export async function listAttendance(
  limit = 50
): Promise<{ data: AttendanceRow[]; error?: string }> {
  if (!supabase) return { data: [], error: "Supabase not configured." };
  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .order("scanned_at", { ascending: false })
    .limit(limit);
  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as AttendanceRow[] };
}

export type AttendanceFilter = {
  from?: string; // yyyy-mm-dd inclusive
  to?: string; // yyyy-mm-dd inclusive
  status?: "" | AttStatus;
  event?: "" | AttEvent;
  org?: string; // "" = all orgs
  search?: string; // matches name or LRN
};

/** Filtered + searched report query. RLS scopes rows to the owner. */
export async function queryAttendance(
  f: AttendanceFilter,
  limit = 1000
): Promise<{ data: AttendanceRow[]; error?: string }> {
  if (!supabase) return { data: [], error: "Supabase not configured." };
  let q = supabase.from("attendance").select("*");

  if (f.from) q = q.gte("scanned_at", `${f.from}T00:00:00`);
  if (f.to) q = q.lte("scanned_at", `${f.to}T23:59:59.999`);
  if (f.status) q = q.eq("status", f.status);
  if (f.event) q = q.eq("event", f.event);
  if (f.org) q = q.eq("org", f.org);

  const s = (f.search ?? "").trim().replace(/[%,]/g, " ");
  if (s) q = q.or(`student_name.ilike.%${s}%,student_lrn.ilike.%${s}%`);

  const { data, error } = await q.order("scanned_at", { ascending: false }).limit(limit);
  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as AttendanceRow[] };
}

/** Build a CSV string from attendance rows. */
export function attendanceToCsv(rows: AttendanceRow[]): string {
  const head = ["Organization", "Name", "LRN", "Event", "Status", "Source", "Date", "Time"];
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = rows.map((r) => {
    const d = new Date(r.scanned_at);
    return [
      r.org ?? "",
      r.student_name ?? "",
      r.student_lrn,
      r.event === "out" ? "Time Out" : "Time In",
      r.status,
      r.source ?? "",
      d.toLocaleDateString(),
      d.toLocaleTimeString(),
    ]
      .map((v) => esc(String(v)))
      .join(",");
  });
  return [head.join(","), ...lines].join("\r\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Pull a usable LRN out of whatever the scanner produced. Hardware scanners
 * append a newline/tab; QR may hold raw LRN or a JSON blob. We extract the
 * first long digit run, falling back to the trimmed string.
 */
export function normalizeScan(raw: string): string {
  const t = raw.trim();
  // JSON payload? try lrn field.
  if (t.startsWith("{")) {
    try {
      const o = JSON.parse(t);
      if (o.lrn) return String(o.lrn).trim();
    } catch {
      /* fall through */
    }
  }
  // Longest digit run (LRNs are typically 12 digits).
  const digits = t.match(/\d{6,}/);
  return digits ? digits[0] : t;
}
