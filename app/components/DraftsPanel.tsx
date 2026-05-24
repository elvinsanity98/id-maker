"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { deleteDraft, listDrafts, saveDraft } from "@/lib/drafts";
import { TIER_LIMITS, type DraftPayload, type DraftRow } from "@/lib/types";

type Props = {
  currentPayload: DraftPayload;
  onLoad: (payload: DraftPayload) => void;
  onUpgradeRequest: () => void;
};

export default function DraftsPanel({ currentPayload, onLoad, onUpgradeRequest }: Props) {
  const { user, tier } = useAuth();
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const limit = TIER_LIMITS[tier].maxDrafts;
  const atLimit = drafts.length >= limit;

  const refresh = useCallback(async () => {
    const { data } = await listDrafts();
    setDrafts(data);
  }, []);

  useEffect(() => {
    if (!user) {
      setDrafts([]);
      return;
    }
    refresh();
  }, [user, refresh]);

  const onSave = async () => {
    if (!user) return;
    setError(null);
    if (atLimit) {
      setShowSave(false);
      onUpgradeRequest();
      return;
    }
    setBusy(true);
    const { error: err } = await saveDraft(
      user.id,
      draftName.trim() || `Draft ${drafts.length + 1}`,
      currentPayload
    );
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setShowSave(false);
    setDraftName("");
    refresh();
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this draft? This cannot be undone.")) return;
    const { error: err } = await deleteDraft(id);
    if (err) {
      alert(err);
      return;
    }
    refresh();
  };

  if (!user) {
    return (
      <div className="text-xs text-slate-500 italic p-2 bg-slate-50 rounded border border-slate-200">
        Sign in to save and reload your designs later.
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-slate-500">
          {drafts.length} / {limit} drafts
        </span>
        {atLimit && tier === "free" && (
          <button
            type="button"
            onClick={onUpgradeRequest}
            className="text-[11px] font-bold text-amber-700 underline"
          >
            ★ Upgrade for more
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          if (atLimit) {
            onUpgradeRequest();
            return;
          }
          setShowSave(true);
        }}
        className="w-full mb-3 px-3 py-2 text-sm font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
      >
        + Save current as draft
      </button>

      {drafts.length === 0 ? (
        <div className="text-xs text-slate-400 italic text-center py-2">No drafts yet.</div>
      ) : (
        <ul className="space-y-1.5 max-h-48 overflow-y-auto">
          {drafts.map((d) => (
            <li
              key={d.id}
              className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 rounded border border-slate-200 group"
            >
              <button
                type="button"
                onClick={() => onLoad(d.payload)}
                className="flex-1 text-left min-w-0"
                title="Load this draft"
              >
                <div className="text-sm font-medium text-slate-800 truncate group-hover:text-blue-600">
                  {d.name}
                </div>
                <div className="text-[10px] text-slate-400">
                  {new Date(d.updated_at).toLocaleString()}
                </div>
              </button>
              <button
                type="button"
                onClick={() => onDelete(d.id)}
                className="text-slate-400 hover:text-red-600 text-sm px-1"
                aria-label="Delete draft"
                title="Delete"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {showSave && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowSave(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-5 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-slate-900 mb-3">Save draft</h3>
            <input
              type="text"
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="e.g. Juan dela Cruz — Grade 10"
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {error && (
              <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2 mt-2">
                {error}
              </div>
            )}
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={onSave}
                disabled={busy}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded font-semibold text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {busy ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setShowSave(false)}
                className="px-3 py-2 bg-slate-200 text-slate-700 rounded font-semibold text-sm hover:bg-slate-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
