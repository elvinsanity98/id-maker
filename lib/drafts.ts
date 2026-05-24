"use client";

import { supabase } from "./supabase";
import type { DraftPayload, DraftRow } from "./types";

/**
 * Thin wrappers around the `drafts` table. All operations rely on RLS
 * to scope rows to the current user — never pass a user_id from the
 * client; the policy enforces auth.uid() = user_id.
 */

export async function listDrafts(): Promise<{ data: DraftRow[]; error?: string }> {
  if (!supabase) return { data: [], error: "Supabase not configured." };
  const { data, error } = await supabase
    .from("drafts")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as DraftRow[] };
}

export async function saveDraft(
  userId: string,
  name: string,
  payload: DraftPayload
): Promise<{ id?: string; error?: string }> {
  if (!supabase) return { error: "Supabase not configured." };
  const { data, error } = await supabase
    .from("drafts")
    .insert({ user_id: userId, name: name.trim() || "Untitled", payload })
    .select("id")
    .single();
  if (error) return { error: error.message };
  return { id: data.id as string };
}

export async function updateDraft(
  id: string,
  name: string,
  payload: DraftPayload
): Promise<{ error?: string }> {
  if (!supabase) return { error: "Supabase not configured." };
  const { error } = await supabase
    .from("drafts")
    .update({ name: name.trim() || "Untitled", payload })
    .eq("id", id);
  if (error) return { error: error.message };
  return {};
}

/**
 * Rename a draft without touching its payload. Useful when the active
 * draft has unsaved form changes — renaming should NOT clobber the user's
 * in-progress edits, only relabel the row.
 */
export async function renameDraft(
  id: string,
  name: string
): Promise<{ error?: string }> {
  if (!supabase) return { error: "Supabase not configured." };
  const { error } = await supabase
    .from("drafts")
    .update({ name: name.trim() || "Untitled" })
    .eq("id", id);
  if (error) return { error: error.message };
  return {};
}

export async function deleteDraft(id: string): Promise<{ error?: string }> {
  if (!supabase) return { error: "Supabase not configured." };
  const { error } = await supabase.from("drafts").delete().eq("id", id);
  if (error) return { error: error.message };
  return {};
}
