"use client";

import { supabase } from "./supabase";
import type { CardData } from "./types";

export type StudentRow = {
  id: string;
  owner_id: string;
  lrn: string;
  name: string | null;
  grade: string | null;
  school: string | null;
  photo: string | null;
  updated_at: string;
};

/**
 * Upsert a student into the roster from card data. Called when a draft is
 * saved so the roster stays in sync without separate data entry. Skips if
 * there's no LRN (nothing to key on).
 */
export async function upsertStudentFromCard(
  ownerId: string,
  data: CardData
): Promise<{ error?: string }> {
  if (!supabase) return { error: "Supabase not configured." };
  const lrn = data.lrn?.trim();
  if (!lrn) return {}; // no LRN — nothing to register, not an error

  const { error } = await supabase.from("students").upsert(
    {
      owner_id: ownerId,
      lrn,
      name: data.studentName?.trim() || null,
      grade: data.birthday?.trim() || null, // "grade" field reused per card layout
      school: data.schoolName?.trim() || null,
      photo: data.photo || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "owner_id,lrn" }
  );
  if (error) return { error: error.message };
  return {};
}

/** Look up a student by LRN within the signed-in user's roster. */
export async function findStudentByLrn(
  lrn: string
): Promise<{ student?: StudentRow; error?: string }> {
  if (!supabase) return { error: "Supabase not configured." };
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("lrn", lrn.trim())
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return {};
  return { student: data as StudentRow };
}
