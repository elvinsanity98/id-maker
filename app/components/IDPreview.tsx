"use client";

import type { CardData, CardSide, CardSize, ColorPalette, TemplateId } from "@/lib/types";
import BlueWaveTemplate from "./templates/BlueWaveTemplate";
import DarkGoldTemplate from "./templates/DarkGoldTemplate";
import MinimalTemplate from "./templates/MinimalTemplate";
import ModernGradientTemplate from "./templates/ModernGradientTemplate";

type Props = {
  data: CardData;
  size: CardSize;
  template: TemplateId;
  palette: ColorPalette;
  view: CardSide | "both";
  setView: (v: CardSide | "both") => void;
};

export default function IDPreview({ data, size, template, palette, view, setView }: Props) {
  const showFront = view === "front" || view === "both";
  const showBack = view === "back" || view === "both";

  return (
    <section className="bg-white rounded-xl shadow-sm p-3 sm:p-6 min-h-[420px] sm:min-h-[600px]">
      <div className="no-print flex justify-center gap-2 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-slate-100 flex-wrap">
        <ViewBtn label="Front" mobileLabel="Front" active={view === "front"} onClick={() => setView("front")} />
        <ViewBtn label="Back" mobileLabel="Back" active={view === "back"} onClick={() => setView("back")} />
        <ViewBtn label="Both Sides" mobileLabel="Both" active={view === "both"} onClick={() => setView("both")} />
      </div>

      <div className="print-area flex justify-center items-center gap-4 sm:gap-6 flex-wrap p-3 sm:p-8 bg-slate-50 rounded-lg min-h-[340px] sm:min-h-[500px] overflow-x-auto">
        {showFront && (
          <TemplateCard data={data} size={size} template={template} palette={palette} side="front" />
        )}
        {showBack && (
          <TemplateCard data={data} size={size} template={template} palette={palette} side="back" />
        )}
      </div>
    </section>
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
