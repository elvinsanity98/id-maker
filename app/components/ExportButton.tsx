"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { TIER_LIMITS, type ExportFormat } from "@/lib/types";

type Props = {
  /** Returns the DOM node we should render to an image. */
  getNode: () => HTMLElement | null;
  /** Default filename (without extension). */
  baseName?: string;
  onUpgradeRequest: () => void;
};

const FORMAT_LABELS: Record<ExportFormat, string> = {
  png: "PNG (recommended)",
  jpeg: "JPG",
  svg: "SVG (vector)",
};

export default function ExportButton({
  getNode,
  baseName = "id-card",
  onUpgradeRequest,
}: Props) {
  const { tier } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const allowed = TIER_LIMITS[tier].exportFormats as readonly ExportFormat[];

  const handle = async (format: ExportFormat) => {
    setOpen(false);
    if (!allowed.includes(format)) {
      onUpgradeRequest();
      return;
    }
    const node = getNode();
    if (!node) return;
    setBusy(true);
    try {
      // Lazy-import so the html-to-image bundle isn't on the critical path
      // for users who never export.
      const lib = await import("html-to-image");
      const opts = { pixelRatio: 2, cacheBust: true, backgroundColor: "#ffffff" };
      let dataUrl: string;
      let ext: string;
      if (format === "png") {
        dataUrl = await lib.toPng(node, opts);
        ext = "png";
      } else if (format === "jpeg") {
        dataUrl = await lib.toJpeg(node, { ...opts, quality: 0.95 });
        ext = "jpg";
      } else {
        dataUrl = await lib.toSvg(node, opts);
        ext = "svg";
      }
      const link = document.createElement("a");
      link.download = `${baseName}.${ext}`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("[export] failed:", err);
      alert(
        "Export failed. Try removing your photo / logo or switching to PNG. (Details in the console.)"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-md border bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 transition disabled:opacity-60 flex items-center gap-1"
      >
        {busy ? "Exporting…" : "⬇ Download"}
        <span className="text-[10px]">▾</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-md shadow-lg border border-slate-200 z-50 overflow-hidden">
            <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-slate-500 font-semibold bg-slate-50 border-b border-slate-200">
              Save as image
            </div>
            {(Object.keys(FORMAT_LABELS) as ExportFormat[]).map((f) => {
              const locked = !allowed.includes(f);
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => handle(f)}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition ${
                    locked
                      ? "text-slate-500 hover:bg-amber-50"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>{FORMAT_LABELS[f]}</span>
                  {locked && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                      ★ Premium
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
