"use client";

import { supabase } from "./supabase";

export type AttendanceRow = {
  id: string;
  owner_id: string;
  student_lrn: string;
  student_name: string | null;
  status: "present" | "late" | "absent";
  source: string | null;
  scanned_at: string;
};

export async function logAttendance(
  ownerId: string,
  studentLrn: string,
  studentName: string | null,
  status: "present" | "late" | "absent",
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
