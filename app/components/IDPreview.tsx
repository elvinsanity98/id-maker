"use client";

import type { CardData, CardSide, CardSize, TemplateId } from "@/lib/types";
import BlueWaveTemplate from "./templates/BlueWaveTemplate";
import DarkGoldTemplate from "./templates/DarkGoldTemplate";
import MinimalTemplate from "./templates/MinimalTemplate";

type Props = {
  data: CardData;
  size: CardSize;
  template: TemplateId;
  view: CardSide | "both";
  setView: (v: CardSide | "both") => void;
};

export default function IDPreview({ data, size, template, view, setView }: Props) {
  const showFront = view === "front" || view === "both";
  const showBack = view === "back" || view === "both";

  return (
    <section className="bg-white rounded-xl shadow-sm p-6 min-h-[600px]">
      <div className="no-print flex justify-center gap-2 mb-6 pb-4 border-b border-slate-100">
        <ViewBtn label="Front" active={view === "front"} onClick={() => setView("front")} />
        <ViewBtn label="Back" active={view === "back"} onClick={() => setView("back")} />
        <ViewBtn label="Both Sides" active={view === "both"} onClick={() => setView("both")} />
      </div>

      <div className="print-area flex justify-center items-center gap-6 flex-wrap p-8 bg-slate-50 rounded-lg min-h-[500px]">
        {showFront && (
          <div className={!showBack && view !== "both" ? "" : ""}>
            <TemplateCard data={data} size={size} template={template} side="front" />
          </div>
        )}
        {showBack && (
          <div>
            <TemplateCard data={data} size={size} template={template} side="back" />
          </div>
        )}
      </div>
    </section>
  );
}

function TemplateCard({
  data,
  size,
  template,
  side,
}: {
  data: CardData;
  size: CardSize;
  template: TemplateId;
  side: CardSide;
}) {
  if (template === "dark-gold") return <DarkGoldTemplate data={data} size={size} side={side} />;
  if (template === "minimal") return <MinimalTemplate data={data} size={size} side={side} />;
  return <BlueWaveTemplate data={data} size={size} side={side} />;
}

function ViewBtn({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold rounded-md border transition ${
        active
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}
