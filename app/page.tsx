"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import IDForm from "./components/IDForm";
import IDPreview from "./components/IDPreview";
import UserMenu from "./components/UserMenu";
import UpgradeModal from "./components/UpgradeModal";
import {
  CARD_SIZES,
  DEFAULT_DATA,
  PALETTES,
  defaultPalette,
  payloadToConfig,
  type CardConfig,
  type CardData,
  type CardSide,
  type CardSize,
  type ColorPalette,
  type DraftPayload,
  type TemplateId,
} from "@/lib/types";

export default function Home() {
  const [data, setData] = useState<CardData>(DEFAULT_DATA);
  const [size, setSize] = useState<CardSize>(CARD_SIZES[1]); // medium portrait
  const [template, setTemplate] = useState<TemplateId>("blue-wave");
  const [palette, setPalette] = useState<ColorPalette>(defaultPalette("blue-wave"));
  const [view, setView] = useState<CardSide | "both">("front");
  const [copies, setCopies] = useState<number>(1);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  // When non-null we're in "print batch" mode: the preview ignores the
  // single-card editor state and renders these resolved configs instead.
  const [batchConfigs, setBatchConfigs] = useState<CardConfig[] | null>(null);

  const handleTemplateChange = (t: TemplateId) => {
    setTemplate(t);
    setPalette(defaultPalette(t));
  };

  // Snapshot of everything we'd want to restore when reloading a draft.
  const draftPayload: DraftPayload = {
    data,
    templateId: template,
    paletteId: palette.id,
    sizeId: size.id,
  };

  const loadDraft = useCallback((payload: DraftPayload) => {
    setData(payload.data);
    setTemplate(payload.templateId);
    const nextPalette =
      PALETTES[payload.templateId].find((p) => p.id === payload.paletteId) ??
      defaultPalette(payload.templateId);
    setPalette(nextPalette);
    const nextSize = CARD_SIZES.find((s) => s.id === payload.sizeId) ?? CARD_SIZES[1];
    setSize(nextSize);
  }, []);

  // Resolve the currently-editing config (used in single-card mode).
  const currentConfig: CardConfig = useMemo(
    () => ({ data, size, template, palette }),
    [data, size, template, palette]
  );

  // What the preview actually renders. In batch mode it's the array of
  // selected drafts; otherwise it's the current card repeated `copies` times.
  const renderConfigs: CardConfig[] = useMemo(() => {
    if (batchConfigs) return batchConfigs;
    return Array(Math.max(1, copies)).fill(currentConfig);
  }, [batchConfigs, copies, currentConfig]);

  // When the user kicks off a batch print, resolve each payload to a full
  // CardConfig, set the batch state, then trigger the browser print once
  // React has rendered the new card list. Clear the batch state when the
  // print dialog closes.
  const handlePrintBatch = useCallback((payloads: DraftPayload[]) => {
    if (payloads.length === 0) return;
    const resolved = payloads.map(payloadToConfig);
    setBatchConfigs(resolved);
    setView("both");
  }, []);

  useEffect(() => {
    if (!batchConfigs) return;
    // Wait one frame for the new cards to land in the DOM before printing.
    const t = setTimeout(() => {
      window.print();
      setBatchConfigs(null);
    }, 120);
    return () => clearTimeout(t);
  }, [batchConfigs]);

  const handlePrint = () => window.print();
  const handleReset = () => {
    if (confirm("Reset all fields back to defaults?")) {
      setData(DEFAULT_DATA);
      setCopies(1);
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
            copies={copies}
            setCopies={setCopies}
            draftPayload={draftPayload}
            onLoadDraft={loadDraft}
            onPrintBatch={handlePrintBatch}
            onPrint={handlePrint}
            onReset={handleReset}
            onUpgradeRequest={() => setUpgradeOpen(true)}
          />
        </div>
        <div className="order-1 lg:order-2">
          <IDPreview
            configs={renderConfigs}
            view={view}
            setView={setView}
            isBatch={batchConfigs !== null}
            onUpgradeRequest={() => setUpgradeOpen(true)}
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
