"use client";

import { useRef } from "react";
import type { CardData, CardSide, CardSize, ColorPalette, TemplateId } from "@/lib/types";
import BlueWaveTemplate from "./templates/BlueWaveTemplate";
import DarkGoldTemplate from "./templates/DarkGoldTemplate";
import MinimalTemplate from "./templates/MinimalTemplate";
import ModernGradientTemplate from "./templates/ModernGradientTemplate";
import { useAuth } from "./AuthProvider";
import ExportButton from "./ExportButton";

type Props = {
  data: CardData;
  size: CardSize;
  template: TemplateId;
  palette: ColorPalette;
  view: CardSide | "both";
  setView: (v: CardSide | "both") => void;
  copies: number;
  onUpgradeRequest: () => void;
};

export default function IDPreview({
  data,
  size,
  template,
  palette,
  view,
  setView,
  copies,
  onUpgradeRequest,
}: Props) {
  const { tier } = useAuth();
  const showWatermark = tier === "free";
  const showFront = view === "front" || view === "both";
  const showBack = view === "back" || view === "both";
  const printAreaRef = useRef<HTMLDivElement>(null);
  // Clamp the rendered copies — UI also enforces this but defense-in-depth.
  const safeCopies = Math.max(1, Math.min(50, copies));
  const fileBase = (data.studentName || "id-card")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "id-card";

  // Build the list of card slots to render. When copies > 1 we repeat
  // whichever side(s) are visible — gives a true preview of what print
  // will produce.
  const slots: Array<{ side: CardSide; key: string }> = [];
  for (let i = 0; i < safeCopies; i++) {
    if (showFront) slots.push({ side: "front", key: `front-${i}` });
    if (showBack) slots.push({ side: "back", key: `back-${i}` });
  }

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
          baseName={fileBase}
          onUpgradeRequest={onUpgradeRequest}
        />
      </div>

      {safeCopies > 1 && (
        <div className="no-print text-xs text-slate-500 mb-3 px-2">
          Printing <strong>{safeCopies}</strong>{" "}
          {showFront && showBack ? "double-sided " : ""}
          {safeCopies === 1 ? "card" : "cards"}.
        </div>
      )}

      <div
        ref={printAreaRef}
        className="print-area flex justify-center items-center gap-4 sm:gap-6 flex-wrap p-3 sm:p-8 bg-slate-50 rounded-lg min-h-[340px] sm:min-h-[500px] overflow-x-auto"
      >
        {slots.map(({ side, key }) => (
          <CardWithWatermark
            key={key}
            side={side}
            showWatermark={showWatermark && side === "back"}
          >
            <TemplateCard
              data={data}
              size={size}
              template={template}
              palette={palette}
              side={side}
            />
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

function TemplateCard({
  data,
  size,
  template,
  palette,
  side,
}: {
  data: CardData;
  size: CardSize;
  template: TemplateId;
  palette: ColorPalette;
  side: CardSide;
}) {
  if (template === "dark-gold")
    return <DarkGoldTemplate data={data} size={size} side={side} palette={palette} />;
  if (template === "minimal")
    return <MinimalTemplate data={data} size={size} side={side} palette={palette} />;
  if (template === "modern-gradient")
    return <ModernGradientTemplate data={data} size={size} side={side} palette={palette} />;
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
