"use client";

import { useCallback, useMemo, useState } from "react";
import IDForm from "./components/IDForm";
import IDPreview from "./components/IDPreview";
import UserMenu from "./components/UserMenu";
import UpgradeModal from "./components/UpgradeModal";
import type { ActiveDraft } from "./components/DraftsPanel";
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
  // Live batch selection from the drafts panel. When non-empty the preview
  // renders these instead of the single-card editor state, so what you see
  // is exactly what print / download produces.
  const [batchPayloads, setBatchPayloads] = useState<DraftPayload[]>([]);
  // The draft currently loaded into the editor. "Save changes" in the
  // drafts panel updates this row in place instead of creating a new one.
  const [activeDraft, setActiveDraft] = useState<ActiveDraft>(null);

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
    // DraftsPanel also clears its own selection on load; this is redundant
    // safety in case loadDraft ever gets called from elsewhere.
    setBatchPayloads([]);
  }, []);

  // Resolve the currently-editing config (used in single-card mode).
  const currentConfig: CardConfig = useMemo(
    () => ({ data, size, template, palette }),
    [data, size, template, palette]
  );

  // Resolved batch (if any drafts are checked).
  const batchConfigs: CardConfig[] | null = useMemo(
    () => (batchPayloads.length > 0 ? batchPayloads.map(payloadToConfig) : null),
    [batchPayloads]
  );

  // What the preview actually renders. Batch wins if anything is checked;
  // otherwise it's the current card repeated `copies` times.
  const renderConfigs: CardConfig[] = useMemo(() => {
    if (batchConfigs) return batchConfigs;
    return Array(Math.max(1, copies)).fill(currentConfig);
  }, [batchConfigs, copies, currentConfig]);

  const handlePrint = () => window.print();
  const handlePrintBatch = useCallback(() => {
    // Preview is already showing the batch (driven by the selection effect
    // in DraftsPanel) so we just kick off the print dialog.
    window.print();
  }, []);

  const handleReset = () => {
    if (confirm("Reset all fields back to defaults?")) {
      setData(DEFAULT_DATA);
      setCopies(1);
      // Resetting fields means we're no longer "editing" a specific draft.
      setActiveDraft(null);
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
            onSelectionChange={setBatchPayloads}
            onPrintBatch={handlePrintBatch}
            activeDraft={activeDraft}
            setActiveDraft={setActiveDraft}
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
