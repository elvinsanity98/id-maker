"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { deleteDraft, listDrafts, renameDraft, saveDraft, updateDraft } from "@/lib/drafts";
import { upsertStudentFromCard } from "@/lib/students";
import { TIER_LIMITS, type DraftPayload, type DraftRow } from "@/lib/types";

/** The draft currently being edited (loaded into the form). */
export type ActiveDraft = { id: string; name: string } | null;

type Props = {
  currentPayload: DraftPayload;
  onLoad: (payload: DraftPayload) => void;
  /** Fired whenever the checkbox selection changes. Drives the live preview. */
  onSelectionChange: (payloads: DraftPayload[]) => void;
  /** User clicked "Print N selected" — preview already shows the batch. */
  onPrintBatch: () => void;
  /** Which draft is currently loaded into the editor (null = brand-new card). */
  activeDraft: ActiveDraft;
  setActiveDraft: (d: ActiveDraft) => void;
  onUpgradeRequest: () => void;
};

export default function DraftsPanel({
  currentPayload,
  onLoad,
  onSelectionChange,
  onPrintBatch,
  activeDraft,
  setActiveDraft,
  onUpgradeRequest,
}: Props) {
  const { user, tier } = useAuth();
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [savedHint, setSavedHint] = useState<string | null>(null);
  // Inline-rename state: which row is currently in rename mode + the
  // unsaved input text. null = no row is being renamed.
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

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
      setActiveDraft(null);
      return;
    }
    refresh();
  }, [user, refresh, setActiveDraft]);

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
    // Mirror into the attendance roster (keyed by LRN). Non-fatal if it fails.
    await upsertStudentFromCard(user.id, currentPayload.data);
    setShowSave(false);
    setDraftName("");
    flashSaved("Saved as new draft");
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
    // Drop the active marker if we just deleted the loaded draft.
    if (activeDraft?.id === id) setActiveDraft(null);
    refresh();
  };

  const flashSaved = (msg: string) => {
    setSavedHint(msg);
    setTimeout(() => setSavedHint(null), 1800);
  };

  /** Update the currently-loaded draft in place. */
  const onSaveChanges = async () => {
    if (!user || !activeDraft) return;
    setBusy(true);
    setError(null);
    const { error: err } = await updateDraft(
      activeDraft.id,
      activeDraft.name,
      currentPayload
    );
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    await upsertStudentFromCard(user.id, currentPayload.data);
    flashSaved(`Saved "${activeDraft.name}"`);
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

  // When the user clicks a draft to LOAD it for editing, mark it as the
  // active draft (so subsequent "Save changes" updates it in place) and
  // drop the batch selection so the preview switches back to single-edit.
  const handleLoadClick = (draft: DraftRow) => {
    setSelected(new Set());
    setActiveDraft({ id: draft.id, name: draft.name });
    onLoad(draft.payload);
  };

  const startRename = (d: DraftRow) => {
    setRenamingId(d.id);
    setRenameValue(d.name);
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameValue("");
  };

  const submitRename = async (d: DraftRow) => {
    const next = renameValue.trim();
    if (!next || next === d.name) {
      cancelRename();
      return;
    }
    const { error: err } = await renameDraft(d.id, next);
    if (err) {
      alert(err);
      return;
    }
    // Keep the active-draft banner in sync if we just renamed the loaded one.
    if (activeDraft?.id === d.id) {
      setActiveDraft({ id: d.id, name: next });
    }
    cancelRename();
    flashSaved(`Renamed to "${next}"`);
    refresh();
  };

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

      {activeDraft && (
        <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-[11px] text-blue-900">
          Editing: <strong>{activeDraft.name}</strong>
          <button
            type="button"
            onClick={() => setActiveDraft(null)}
            className="float-right text-blue-700 hover:text-blue-900 underline"
            title="Stop tracking this draft"
          >
            unlink
          </button>
        </div>
      )}

      {activeDraft ? (
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={onSaveChanges}
            disabled={busy}
            className="flex-1 px-3 py-2 text-sm font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
          >
            💾 Save changes
          </button>
          <button
            type="button"
            onClick={() => {
              if (atLimit) {
                onUpgradeRequest();
                return;
              }
              setShowSave(true);
            }}
            className="px-3 py-2 text-sm font-semibold bg-white text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition"
            title="Save as a separate new draft"
          >
            + New copy
          </button>
        </div>
      ) : (
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
      )}

      {savedHint && (
        <div className="mb-2 px-2 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded">
          ✓ {savedHint}
        </div>
      )}

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
              const isActive = activeDraft?.id === d.id;
              const isRenaming = renamingId === d.id;
              return (
                <li
                  key={d.id}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded border transition ${
                    isChecked
                      ? "bg-emerald-50 border-emerald-300"
                      : isActive
                      ? "bg-blue-50 border-blue-300"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggle(d.id)}
                    disabled={isRenaming}
                    className="w-4 h-4 accent-emerald-600 cursor-pointer flex-shrink-0 disabled:opacity-50"
                    aria-label={`Select ${d.name} for batch print`}
                  />
                  {isRenaming ? (
                    <>
                      <input
                        type="text"
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") submitRename(d);
                          else if (e.key === "Escape") cancelRename();
                        }}
                        className="flex-1 min-w-0 px-2 py-1 text-sm border border-blue-400 rounded bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="New name"
                      />
                      <button
                        type="button"
                        onClick={() => submitRename(d)}
                        className="text-emerald-600 hover:text-emerald-800 text-sm font-bold px-1 flex-shrink-0"
                        title="Save (Enter)"
                        aria-label="Save rename"
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        onClick={cancelRename}
                        className="text-slate-400 hover:text-slate-700 text-sm font-bold px-1 flex-shrink-0"
                        title="Cancel (Esc)"
                        aria-label="Cancel rename"
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleLoadClick(d)}
                        className="flex-1 text-left min-w-0"
                        title="Load this draft into the editor (clears batch selection)"
                      >
                        <div
                          className={`text-sm font-medium truncate hover:text-blue-600 ${
                            isActive ? "text-blue-700" : "text-slate-800"
                          }`}
                        >
                          {d.name}
                          {isActive && (
                            <span className="ml-1 text-[10px] font-bold uppercase tracking-wider text-blue-600">
                              · editing
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(d.updated_at).toLocaleString()}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => startRename(d)}
                        className="text-slate-400 hover:text-blue-600 text-sm px-1 flex-shrink-0"
                        aria-label="Rename draft"
                        title="Rename"
                      >
                        ✎
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
                    </>
                  )}
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
