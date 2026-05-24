"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthProvider";
import { deleteDraft, listDrafts, saveDraft } from "@/lib/drafts";
import { TIER_LIMITS, type DraftPayload, type DraftRow } from "@/lib/types";

type Props = {
  currentPayload: DraftPayload;
  onLoad: (payload: DraftPayload) => void;
  /** Fired whenever the checkbox selection changes. Drives the live preview. */
  onSelectionChange: (payloads: DraftPayload[]) => void;
  /** User clicked "Print N selected" — preview already shows the batch. */
  onPrintBatch: () => void;
  onUpgradeRequest: () => void;
};

export default function DraftsPanel({
  currentPayload,
  onLoad,
  onSelectionChange,
  onPrintBatch,
  onUpgradeRequest,
}: Props) {
  const { user, tier } = useAuth();
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const limit = TIER_LIMITS[tier].maxDrafts;
  const batchLimit = TIER_LIMITS[tier].maxCopies;
  const atLimit = drafts.length >= limit;
  const selectedCount = selected.size;
  const overBatch = selectedCount > batchLimit;

  const refresh = useCallback(async () => {
    const { data } = await listDrafts();
    setDrafts(data);
  }, []);

  useEffect(() => {
    if (!user) {
      setDrafts([]);
      setSelected(new Set());
      return;
    }
    refresh();
  }, [user, refresh]);

  // Whenever the selection or drafts list changes, recompute the array of
  // selected payloads and notify the parent. This is what drives the live
  // preview / print / download — keeping selection here but emitting upward
  // lets the panel stay self-contained while the rest of the app reacts.
  useEffect(() => {
    const payloads = drafts.filter((d) => selected.has(d.id)).map((d) => d.payload);
    onSelectionChange(payloads);
  }, [selected, drafts, onSelectionChange]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectAll = () => setSelected(new Set(drafts.map((d) => d.id)));
  const clearSelection = () => setSelected(new Set());

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
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    refresh();
  };

  const handlePrintBatch = () => {
    if (overBatch) {
      onUpgradeRequest();
      return;
    }
    if (selectedCount === 0) return;
    // Preview is already showing the batch (driven by onSelectionChange).
    // Just fire the print dialog.
    onPrintBatch();
  };

  // When the user clicks a draft to LOAD it for editing, drop the batch
  // selection too so the preview switches back to the single edit view.
  const handleLoadClick = (payload: DraftPayload) => {
    setSelected(new Set());
    onLoad(payload);
  };

  // Preserve original draft order when building the batch payload list.
  const selectedDrafts = useMemo(
    () => drafts.filter((d) => selected.has(d.id)),
    [drafts, selected]
  );

  if (!user) {
    return (
      <div className="text-xs text-slate-500 italic p-2 bg-slate-50 rounded border border-slate-200">
        Sign in to save and reload your designs later. Each student you save here
        becomes a draft you can include in a batch print.
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
        className="w-full mb-2 px-3 py-2 text-sm font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
      >
        + Save current as draft
      </button>

      {drafts.length === 0 ? (
        <div className="text-xs text-slate-400 italic text-center py-2">
          No drafts yet. Save a student to print them as part of a batch later.
        </div>
      ) : (
        <>
          {/* Batch print toolbar — only visible once something's selected */}
          {selectedCount > 0 && (
            <div className="mb-2 p-2 bg-emerald-50 border border-emerald-200 rounded">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-emerald-900">
                  {selectedCount} selected{overBatch ? ` (max ${batchLimit})` : ""}
                </span>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-[10px] text-emerald-700 underline"
                >
                  Clear
                </button>
              </div>
              <button
                type="button"
                onClick={handlePrintBatch}
                className={`w-full px-3 py-1.5 text-sm font-semibold rounded transition ${
                  overBatch
                    ? "bg-amber-500 text-white hover:bg-amber-600"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                {overBatch
                  ? `★ Upgrade to print ${selectedCount}`
                  : `🖨 Print ${selectedCount} selected`}
              </button>
              {tier === "free" && (
                <p className="text-[10px] text-emerald-800 mt-1">
                  Free batch limit: {batchLimit} students per print.
                </p>
              )}
            </div>
          )}

          {drafts.length > 1 && (
            <div className="flex justify-end mb-1.5">
              <button
                type="button"
                onClick={selectedCount === drafts.length ? clearSelection : selectAll}
                className="text-[10px] text-blue-600 underline"
              >
                {selectedCount === drafts.length ? "Deselect all" : "Select all"}
              </button>
            </div>
          )}

          <ul className="space-y-1.5 max-h-48 overflow-y-auto">
            {drafts.map((d) => {
              const isChecked = selected.has(d.id);
              return (
                <li
                  key={d.id}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded border transition ${
                    isChecked
                      ? "bg-emerald-50 border-emerald-300"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggle(d.id)}
                    className="w-4 h-4 accent-emerald-600 cursor-pointer flex-shrink-0"
                    aria-label={`Select ${d.name} for batch print`}
                  />
                  <button
                    type="button"
                    onClick={() => handleLoadClick(d.payload)}
                    className="flex-1 text-left min-w-0"
                    title="Load this draft into the editor (clears batch selection)"
                  >
                    <div className="text-sm font-medium text-slate-800 truncate hover:text-blue-600">
                      {d.name}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(d.updated_at).toLocaleString()}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(d.id)}
                    className="text-slate-400 hover:text-red-600 text-sm px-1 flex-shrink-0"
                    aria-label="Delete draft"
                    title="Delete"
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="text-[10px] text-slate-500 mt-2 italic">
            Tick a box to include a draft in the preview. Anything you check
            is what prints and downloads.
          </p>
        </>
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
