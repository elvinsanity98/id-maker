"use client";

import { supabase } from "./supabase";

export type OrgSettings = {
  org: string;
  late_after_in: string; // HH:MM
  late_after_out: string; // HH:MM
};

const DEFAULTS: Omit<OrgSettings, "org"> = {
  late_after_in: "08:00",
  late_after_out: "17:00",
};

/** Distinct org names (school names) from the signed-in user's roster. */
export async function listOrgs(): Promise<string[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("students").select("school");
  if (error || !data) return [];
  const set = new Set<string>();
  data.forEach((r: { school: string | null }) => {
    const s = (r.school ?? "").trim();
    if (s) set.add(s);
  });
  return [...set].sort();
}

export async function getOrgSettings(org: string): Promise<OrgSettings> {
  if (!supabase || !org) return { org, ...DEFAULTS };
  const { data } = await supabase
    .from("org_settings")
    .select("*")
    .eq("org", org)
    .maybeSingle();
  if (!data) return { org, ...DEFAULTS };
  return {
    org,
    late_after_in: data.late_after_in ?? DEFAULTS.late_after_in,
    late_after_out: data.late_after_out ?? DEFAULTS.late_after_out,
  };
}

export async function saveOrgSettings(
  ownerId: string,
  s: OrgSettings
): Promise<{ error?: string }> {
  if (!supabase) return { error: "Supabase not configured." };
  if (!s.org) return { error: "Pick an organization first." };
  const { error } = await supabase.from("org_settings").upsert(
    {
      owner_id: ownerId,
      org: s.org,
      late_after_in: s.late_after_in,
      late_after_out: s.late_after_out,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "owner_id,org" }
  );
  if (error) return { error: error.message };
  return {};
}

/**
 * Decide on-time vs late from the clock. `event` picks which cutoff applies.
 * On-time when the current HH:MM is <= the cutoff, else late.
 */
export function computeStatus(
  settings: OrgSettings,
  event: "in" | "out",
  now = new Date()
): "on-time" | "late" {
  const cutoff = event === "in" ? settings.late_after_in : settings.late_after_out;
  const [ch, cm] = cutoff.split(":").map(Number);
  const cutoffMin = (ch || 0) * 60 + (cm || 0);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return nowMin <= cutoffMin ? "on-time" : "late";
}
