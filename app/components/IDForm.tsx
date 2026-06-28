"use client";

import { ChangeEvent } from "react";
import type { CardData, CardSize, ColorPalette, DraftPayload, TemplateId } from "@/lib/types";
import { CARD_SIZES, PALETTES, TEMPLATES, TIER_LIMITS } from "@/lib/types";
import { useAuth, type Tier } from "./AuthProvider";
import DraftsPanel, { type ActiveDraft } from "./DraftsPanel";

type Props = {
  data: CardData;
  setData: (updater: (prev: CardData) => CardData) => void;
  size: CardSize;
  setSize: (size: CardSize) => void;
  template: TemplateId;
  setTemplate: (t: TemplateId) => void;
  palette: ColorPalette;
  setPalette: (p: ColorPalette) => void;
  copies: number;
  setCopies: (n: number) => void;
  draftPayload: DraftPayload;
  onLoadDraft: (payload: DraftPayload) => void;
  onSelectionChange: (payloads: DraftPayload[]) => void;
  onPrintBatch: () => void;
  activeDraft: ActiveDraft;
  setActiveDraft: (d: ActiveDraft) => void;
  onPrint: () => void;
  onReset: () => void;
  onUpgradeRequest: () => void;
};

// Anything not in this list requires Premium.
const FREE_TEMPLATES: TemplateId[] = ["blue-wave"];

function isTemplateFree(id: TemplateId): boolean {
  return FREE_TEMPLATES.includes(id);
}

function isPaletteFree(template: TemplateId, paletteId: string): boolean {
  // Each template's first palette is the free default.
  return PALETTES[template][0]?.id === paletteId;
}

export default function IDForm({
  data,
  setData,
  size,
  setSize,
  template,
  setTemplate,
  palette,
  setPalette,
  copies,
  setCopies,
  draftPayload,
  onLoadDraft,
  onSelectionChange,
  onPrintBatch,
  activeDraft,
  setActiveDraft,
  onPrint,
  onReset,
  onUpgradeRequest,
}: Props) {
  const { tier } = useAuth();
  const isPremium = tier === "premium";
  const maxCopies = TIER_LIMITS[tier].maxCopies;

  const update = (key: keyof CardData) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const onFile = (key: "photo" | "logo" | "signature") => (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setData((prev) => ({ ...prev, [key]: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const removeFile = (key: "photo" | "logo" | "signature") => () =>
    setData((prev) => ({ ...prev, [key]: null }));

  const tryPickTemplate = (t: TemplateId) => {
    if (!isPremium && !isTemplateFree(t)) {
      onUpgradeRequest();
      return;
    }
    setTemplate(t);
  };

  const tryPickPalette = (p: ColorPalette) => {
    if (!isPremium && !isPaletteFree(template, p.id)) {
      onUpgradeRequest();
      return;
    }
    setPalette(p);
  };

  return (
    <aside className="no-print bg-white rounded-xl shadow-sm p-4 sm:p-5 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
      <Section title="My Drafts">
        <DraftsPanel
          currentPayload={draftPayload}
          onLoad={onLoadDraft}
          onSelectionChange={onSelectionChange}
          onPrintBatch={onPrintBatch}
          activeDraft={activeDraft}
          setActiveDraft={setActiveDraft}
          onUpgradeRequest={onUpgradeRequest}
        />
      </Section>

      <Section title="Template">
        <div className="grid grid-cols-1 gap-2">
          {TEMPLATES.map((t) => {
            const locked = !isPremium && !isTemplateFree(t.id);
            const active = template === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => tryPickTemplate(t.id)}
                className={`relative text-left px-3 py-2 rounded-md border transition ${
                  active
                    ? "bg-blue-600 text-white border-blue-600"
                    : locked
                    ? "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-sm flex-1">{t.label}</div>
                  {locked && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                      ★ Premium
                    </span>
                  )}
                </div>
                <div className={`text-xs ${active ? "text-blue-100" : "text-slate-500"}`}>
                  {t.description}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
            <span>Color palette</span>
            {!isPremium && (
              <span className="text-[10px] font-bold text-amber-700 normal-case">
                ★ Premium for more colors
              </span>
            )}
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            {PALETTES[template].map((p) => {
              const isActive = palette.id === p.id;
              const locked = !isPremium && !isPaletteFree(template, p.id);
              const swatchBg = p.gradientFrom
                ? `linear-gradient(135deg, ${p.gradientFrom} 0%, ${p.gradientTo} 100%)`
                : `linear-gradient(135deg, ${p.primary} 0%, ${p.secondary} 100%)`;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => tryPickPalette(p)}
                  title={locked ? `${p.label} — Premium` : p.label}
                  aria-label={p.label}
                  className={`relative w-8 h-8 rounded-full transition border-2 ${
                    isActive
                      ? "border-slate-900 ring-2 ring-offset-2 ring-slate-400 scale-110"
                      : "border-white shadow hover:scale-110"
                  } ${locked ? "opacity-60" : ""}`}
                  style={{ background: swatchBg }}
                >
                  {locked && (
                    <span className="absolute inset-0 flex items-center justify-center text-white text-[11px] drop-shadow">
                      🔒
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="text-[11px] text-slate-500 mt-2">{palette.label}</div>
        </div>
      </Section>

      <Section title="Card Size">
        <select
          value={size.id}
          onChange={(e) => {
            const next = CARD_SIZES.find((s) => s.id === e.target.value);
            if (next) setSize(next);
          }}
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {CARD_SIZES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </Section>

      <Section title="Batch Print">
        <label className="block text-xs text-slate-600 font-medium">
          Number of copies (max {maxCopies}{tier === "free" ? " on Free" : ""})
          <input
            type="number"
            min={1}
            max={maxCopies}
            value={copies}
            onChange={(e) => {
              const raw = parseInt(e.target.value, 10);
              if (Number.isNaN(raw)) return;
              if (raw > maxCopies) {
                onUpgradeRequest();
                setCopies(maxCopies);
                return;
              }
              setCopies(Math.max(1, raw));
            }}
            className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>
        {tier === "free" && (
          <p className="text-[11px] text-slate-500 mt-2">
            Need to print more at once?{" "}
            <button type="button" onClick={onUpgradeRequest} className="text-amber-700 font-bold underline">
              ★ Premium prints up to 30 per batch
            </button>
          </p>
        )}
      </Section>

      <Section title="School / Organization">
        <Field label="School Name" value={data.schoolName} onChange={update("schoolName")} />
        <Field label="Slogan" value={data.slogan} onChange={update("slogan")} />
      </Section>

      <Section title="Student Photo">
        <input
          type="file"
          accept="image/*"
          onChange={onFile("photo")}
          className="w-full text-sm cursor-pointer file:mr-3 file:px-3 file:py-1.5 file:rounded file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer hover:file:bg-blue-700"
        />
        {data.photo && (
          <button
            type="button"
            onClick={removeFile("photo")}
            className="text-xs text-blue-600 underline mt-2"
          >
            Remove photo
          </button>
        )}
      </Section>

      <PremiumGate
        tier={tier}
        title="School Logo"
        badgeText="★ Premium"
        onUpgradeRequest={onUpgradeRequest}
        lockedDescription="Upload a school logo (PNG with transparency supported) to brand the front and back of the card."
      >
        <p className="text-[11px] text-slate-500 mb-2 -mt-1">
          PNG with transparent background recommended. Also accepts JPG / SVG.
        </p>
        <input
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          onChange={onFile("logo")}
          className="w-full text-sm cursor-pointer file:mr-3 file:px-3 file:py-1.5 file:rounded file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer hover:file:bg-blue-700"
        />
        {data.logo && (
          <div className="flex items-center gap-3 mt-2">
            <div
              className="w-12 h-12 flex items-center justify-center rounded border border-slate-200"
              style={{
                backgroundImage:
                  "linear-gradient(45deg, #f1f5f9 25%, transparent 25%), linear-gradient(-45deg, #f1f5f9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f5f9 75%), linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)",
                backgroundSize: "10px 10px",
                backgroundPosition: "0 0, 0 5px, 5px -5px, -5px 0",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.logo}
                alt="logo preview"
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
              />
            </div>
            <button
              type="button"
              onClick={removeFile("logo")}
              className="text-xs text-blue-600 underline"
            >
              Remove logo
            </button>
          </div>
        )}
      </PremiumGate>

      <Section title="Student Information (Front)">
        <Field label="LRN" value={data.lrn} onChange={update("lrn")} />
        <Field label="Student Name" value={data.studentName} onChange={update("studentName")} />
        <Field label="Father / Guardian" value={data.guardian} onChange={update("guardian")} />
        <Field label="Birthday" value={data.birthday} onChange={update("birthday")} />
        <Field label="Emergency Call" value={data.emergency} onChange={update("emergency")} />
      </Section>

      <Section title="Contact (Back)">
        <Field label="Phone" value={data.phone} onChange={update("phone")} />
        <Field label="Mail" value={data.mail} onChange={update("mail")} />
        <Field label="Website" value={data.website} onChange={update("website")} />
      </Section>

      <Section title="Other Details (Back)">
        <Field label="Principal Name" value={data.principal} onChange={update("principal")} />

        <div className="mb-3">
          <div className="text-xs text-slate-600 font-medium mb-1">Principal Signature</div>
          <p className="text-[11px] text-slate-500 mb-1.5">
            Upload a signature image (PNG with transparent background works best).
            Leave empty to show a script &quot;Signature&quot; placeholder.
          </p>
          <input
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            onChange={onFile("signature")}
            className="w-full text-sm cursor-pointer file:mr-3 file:px-3 file:py-1.5 file:rounded file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer hover:file:bg-blue-700"
          />
          {data.signature && (
            <div className="flex items-center gap-3 mt-2">
              <div
                className="h-12 w-24 flex items-center justify-center rounded border border-slate-200"
                style={{
                  backgroundImage:
                    "linear-gradient(45deg, #f1f5f9 25%, transparent 25%), linear-gradient(-45deg, #f1f5f9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f5f9 75%), linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)",
                  backgroundSize: "10px 10px",
                  backgroundPosition: "0 0, 0 5px, 5px -5px, -5px 0",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.signature}
                  alt="signature preview"
                  style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                />
              </div>
              <button
                type="button"
                onClick={removeFile("signature")}
                className="text-xs text-blue-600 underline"
              >
                Remove signature
              </button>
            </div>
          )}
        </div>

        <Field label="Joined Date" value={data.joinedDate} onChange={update("joinedDate")} />
        <Field label="Expire Date" value={data.expireDate} onChange={update("expireDate")} />
        <Field label="Logo Text" value={data.logoText} onChange={update("logoText")} />
        <Field label="Tagline" value={data.tagline} onChange={update("tagline")} />
        <Field label="QR Code Data (URL or text)" value={data.qrData} onChange={update("qrData")} />
        <label className="block mb-2 text-xs text-slate-600 font-medium">
          Terms &amp; Conditions{" "}
          <span className="text-[10px] text-slate-400 font-normal">(other templates)</span>
          <div className="text-[10px] text-slate-400 font-normal">Separate multiple bullets with |</div>
          <textarea
            value={data.terms}
            onChange={update("terms")}
            rows={4}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </label>
      </Section>

      <Section title="DepEd Template Fields">
        <p className="text-[11px] text-slate-500 mb-2 -mt-1">
          Used by the DepEd School ID template. The QR encodes the LRN for
          attendance scanning.
        </p>
        <Field label="Grade & Section" value={data.gradeSection} onChange={update("gradeSection")} />
        <Field label="Emergency Contact Address" value={data.address} onChange={update("address")} />
        <Field label="Validity (S.Y.)" value={data.validity} onChange={update("validity")} />
      </Section>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onPrint}
          className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition"
        >
          Print ID Card
        </button>
        <button
          type="button"
          onClick={onReset}
          className="px-4 py-2.5 bg-slate-200 text-slate-700 font-semibold rounded-md hover:bg-slate-300 transition"
        >
          Reset
        </button>
      </div>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 pb-4 border-b border-slate-100 last:border-0">
      <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

function PremiumGate({
  tier,
  title,
  badgeText,
  onUpgradeRequest,
  lockedDescription,
  children,
}: {
  tier: Tier;
  title: string;
  badgeText: string;
  onUpgradeRequest: () => void;
  lockedDescription: string;
  children: React.ReactNode;
}) {
  if (tier === "premium") {
    return <Section title={title}>{children}</Section>;
  }
  return (
    <div className="mb-5 pb-4 border-b border-slate-100">
      <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3 flex items-center justify-between">
        <span>{title}</span>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
          {badgeText}
        </span>
      </h3>
      <button
        type="button"
        onClick={onUpgradeRequest}
        className="w-full p-3 text-left rounded-md border border-dashed border-amber-300 bg-amber-50/40 hover:bg-amber-50 transition"
      >
        <div className="text-xs text-slate-600 mb-2">{lockedDescription}</div>
        <div className="text-xs text-amber-800 font-semibold">→ Unlock with Premium</div>
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="block mb-2 text-xs text-slate-600 font-medium">
      {label}
      <input
        type="text"
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </label>
  );
}
