"use client";

import { useRef } from "react";
import type { CardConfig, CardSide } from "@/lib/types";
import BlueWaveTemplate from "./templates/BlueWaveTemplate";
import DarkGoldTemplate from "./templates/DarkGoldTemplate";
import MinimalTemplate from "./templates/MinimalTemplate";
import ModernGradientTemplate from "./templates/ModernGradientTemplate";
import DepEdGreenTemplate from "./templates/DepEdGreenTemplate";
import { useAuth } from "./AuthProvider";
import ExportButton from "./ExportButton";

type Props = {
  /**
   * Card slots to render. In single-edit mode this is the current
   * editor state repeated `copies` times. In batch mode the parent
   * builds it from the selected drafts so each entry is a different
   * student.
   */
  configs: CardConfig[];
  view: CardSide | "both";
  setView: (v: CardSide | "both") => void;
  /** True when configs came from a batch-print of drafts, false otherwise. */
  isBatch: boolean;
  onUpgradeRequest: () => void;
};

export default function IDPreview({
  configs,
  view,
  setView,
  isBatch,
  onUpgradeRequest,
}: Props) {
  const { tier } = useAuth();
  const showWatermark = tier === "free";
  const showFront = view === "front" || view === "both";
  const showBack = view === "back" || view === "both";
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Build the flat list of cards we'll render: each config contributes the
  // selected side(s). Cards stay in declared inch dimensions so they print
  // exactly the same regardless of how many are in the batch.
  const slots: Array<{ config: CardConfig; side: CardSide; key: string }> = [];
  configs.forEach((cfg, i) => {
    if (showFront) slots.push({ config: cfg, side: "front", key: `${i}-front` });
    if (showBack) slots.push({ config: cfg, side: "back", key: `${i}-back` });
  });

  const totalCards = slots.length;
  const fileBase =
    (configs[0]?.data.studentName || "id-card")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "id-card";

  return (
    <section className="bg-white rounded-xl shadow-sm p-3 sm:p-6 min-h-[420px] sm:min-h-[600px]">
      <div className="no-print flex flex-wrap justify-between items-center gap-2 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-slate-100">
        <div className="flex gap-2 flex-wrap">
          <ViewBtn label="Front" mobileLabel="Front" active={view === "front"} onClick={() => setView("front")} />
          <ViewBtn label="Back" mobileLabel="Back" active={view === "back"} onClick={() => setView("back")} />
          <ViewBtn label="Both Sides" mobileLabel="Both" active={view === "both"} onClick={() => setView("both")} />
        </div>
        <ExportButton
          getNode={() => printAreaRef.current}
          baseName={isBatch ? "id-batch" : fileBase}
          onUpgradeRequest={onUpgradeRequest}
        />
      </div>

      {(isBatch || configs.length > 1) && (
        <div className="no-print text-xs text-slate-500 mb-3 px-2">
          {isBatch ? (
            <>
              Batch print: <strong>{configs.length}</strong>{" "}
              {configs.length === 1 ? "student" : "students"} · {totalCards}{" "}
              {totalCards === 1 ? "card" : "cards"} total
            </>
          ) : (
            <>
              Printing <strong>{configs.length}</strong>{" "}
              {configs.length === 1 ? "card" : "cards"}.
            </>
          )}
        </div>
      )}

      <div
        ref={printAreaRef}
        className="print-area flex justify-center items-center gap-4 sm:gap-6 flex-wrap p-3 sm:p-8 bg-slate-50 rounded-lg min-h-[340px] sm:min-h-[500px] overflow-x-auto"
      >
        {slots.map(({ config, side, key }) => (
          <CardWithWatermark
            key={key}
            side={side}
            showWatermark={showWatermark && side === "back"}
          >
            <TemplateCard config={config} side={side} />
          </CardWithWatermark>
        ))}
      </div>
    </section>
  );
}

function CardWithWatermark({
  showWatermark,
  side,
  children,
}: {
  showWatermark: boolean;
  side: CardSide;
  children: React.ReactNode;
}) {
  if (!showWatermark) return <>{children}</>;
  return (
    <div className="relative" data-side={side}>
      {children}
      <div
        className="absolute left-0 right-0 text-center pointer-events-none"
        style={{
          bottom: "0",
          background: "rgba(255,255,255,0.88)",
          color: "#475569",
          fontSize: "9px",
          padding: "3px 4px",
          letterSpacing: "1.2px",
          fontWeight: 600,
          borderTop: "1px solid #e2e8f0",
          zIndex: 20,
        }}
      >
        MADE WITH ID MAKER · UPGRADE TO REMOVE
      </div>
    </div>
  );
}

function TemplateCard({ config, side }: { config: CardConfig; side: CardSide }) {
  const { data, size, template, palette } = config;
  if (template === "dark-gold")
    return <DarkGoldTemplate data={data} size={size} side={side} palette={palette} />;
  if (template === "minimal")
    return <MinimalTemplate data={data} size={size} side={side} palette={palette} />;
  if (template === "modern-gradient")
    return <ModernGradientTemplate data={data} size={size} side={side} palette={palette} />;
  if (template === "deped-green")
    return <DepEdGreenTemplate data={data} size={size} side={side} palette={palette} />;
  return <BlueWaveTemplate data={data} size={size} side={side} palette={palette} />;
}

function ViewBtn({
  label,
  mobileLabel,
  active,
  onClick,
}: {
  label: string;
  mobileLabel: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-md border transition ${
        active
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
      }`}
    >
      <span className="sm:hidden">{mobileLabel}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
