"use client";

import { useState } from "react";
import IDForm from "./components/IDForm";
import IDPreview from "./components/IDPreview";
import UserMenu from "./components/UserMenu";
import UpgradeModal from "./components/UpgradeModal";
import {
  CARD_SIZES,
  DEFAULT_DATA,
  defaultPalette,
  type CardData,
  type CardSide,
  type CardSize,
  type ColorPalette,
  type TemplateId,
} from "@/lib/types";

export default function Home() {
  const [data, setData] = useState<CardData>(DEFAULT_DATA);
  const [size, setSize] = useState<CardSize>(CARD_SIZES[1]); // medium portrait
  const [template, setTemplate] = useState<TemplateId>("blue-wave");
  const [palette, setPalette] = useState<ColorPalette>(defaultPalette("blue-wave"));
  const [view, setView] = useState<CardSide | "both">("front");
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const handleTemplateChange = (t: TemplateId) => {
    setTemplate(t);
    // Each template has its own palette options; fall back to that template's first palette.
    setPalette(defaultPalette(t));
  };

  const handlePrint = () => window.print();
  const handleReset = () => {
    if (confirm("Reset all fields back to defaults?")) {
      setData(DEFAULT_DATA);
    }
  };

  return (
    <>
      <header className="no-print bg-gradient-to-br from-blue-600 to-blue-900 text-white py-3 sm:py-4 px-4 sm:px-8 shadow">
        <div className="max-w-[1500px] mx-auto flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold tracking-wide">ID Card Maker</h1>
            <p className="text-[11px] sm:text-sm opacity-90 mt-0.5 hidden sm:block">
              Fill in details — see your ID update live. Pick a template, size, and print.
            </p>
          </div>
          <UserMenu onUpgradeClick={() => setUpgradeOpen(true)} />
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-4 sm:gap-6 p-3 sm:p-6 max-w-[1500px] w-full mx-auto items-start">
        {/* On mobile the preview appears first so the user sees the card + controls immediately. */}
        <div className="order-2 lg:order-1">
          <IDForm
            data={data}
            setData={setData}
            size={size}
            setSize={setSize}
            template={template}
            setTemplate={handleTemplateChange}
            palette={palette}
            setPalette={setPalette}
            onPrint={handlePrint}
            onReset={handleReset}
            onUpgradeRequest={() => setUpgradeOpen(true)}
          />
        </div>
        <div className="order-1 lg:order-2">
          <IDPreview
            data={data}
            size={size}
            template={template}
            palette={palette}
            view={view}
            setView={setView}
          />
        </div>
      </main>

      <footer className="no-print mt-auto py-4 px-6 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        Developed by <span className="font-semibold text-slate-700">Elvin Jhon</span>
      </footer>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </>
  );
}
