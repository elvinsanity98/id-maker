"use client";

import { useState } from "react";
import IDForm from "./components/IDForm";
import IDPreview from "./components/IDPreview";
import {
  CARD_SIZES,
  DEFAULT_DATA,
  type CardData,
  type CardSide,
  type CardSize,
  type TemplateId,
} from "@/lib/types";

export default function Home() {
  const [data, setData] = useState<CardData>(DEFAULT_DATA);
  const [size, setSize] = useState<CardSize>(CARD_SIZES[1]); // medium portrait
  const [template, setTemplate] = useState<TemplateId>("blue-wave");
  const [view, setView] = useState<CardSide | "both">("front");

  const handlePrint = () => window.print();
  const handleReset = () => {
    if (confirm("Reset all fields back to defaults?")) {
      setData(DEFAULT_DATA);
    }
  };

  return (
    <>
      <header className="no-print bg-gradient-to-br from-blue-600 to-blue-900 text-white py-4 sm:py-6 px-4 sm:px-8 text-center shadow">
        <h1 className="text-xl sm:text-2xl font-bold tracking-wide">ID Card Maker</h1>
        <p className="text-xs sm:text-sm opacity-90 mt-1">
          Fill in details — see your ID update live. Pick a template, size, and print.
        </p>
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
            setTemplate={setTemplate}
            onPrint={handlePrint}
            onReset={handleReset}
          />
        </div>
        <div className="order-1 lg:order-2">
          <IDPreview
            data={data}
            size={size}
            template={template}
            view={view}
            setView={setView}
          />
        </div>
      </main>
    </>
  );
}
