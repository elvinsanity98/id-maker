"use client";

import { ChangeEvent } from "react";
import type { CardData, CardSize, TemplateId } from "@/lib/types";
import { CARD_SIZES, TEMPLATES } from "@/lib/types";

type Props = {
  data: CardData;
  setData: (updater: (prev: CardData) => CardData) => void;
  size: CardSize;
  setSize: (size: CardSize) => void;
  template: TemplateId;
  setTemplate: (t: TemplateId) => void;
  onPrint: () => void;
  onReset: () => void;
};

export default function IDForm({
  data,
  setData,
  size,
  setSize,
  template,
  setTemplate,
  onPrint,
  onReset,
}: Props) {
  const update = (key: keyof CardData) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const onFile = (key: "photo" | "logo") => (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setData((prev) => ({ ...prev, [key]: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const removeFile = (key: "photo" | "logo") => () =>
    setData((prev) => ({ ...prev, [key]: null }));

  return (
    <aside className="no-print bg-white rounded-xl shadow-sm p-4 sm:p-5 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
      <Section title="Template">
        <div className="grid grid-cols-1 gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTemplate(t.id)}
              className={`text-left px-3 py-2 rounded-md border transition ${
                template === t.id
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="font-semibold text-sm">{t.label}</div>
              <div className={`text-xs ${template === t.id ? "text-blue-100" : "text-slate-500"}`}>
                {t.description}
              </div>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Card Size">
        <select
          value={size.id}
          onChange={(e) => {
            const next = CARD_SIZES.find((s) => s.id === e.target.value);
            if (next) setSize(next);
          }}
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {CARD_SIZES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
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

      <Section title="School Logo">
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
      </Section>

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
        <Field label="Joined Date" value={data.joinedDate} onChange={update("joinedDate")} />
        <Field label="Expire Date" value={data.expireDate} onChange={update("expireDate")} />
        <Field label="Logo Text" value={data.logoText} onChange={update("logoText")} />
        <Field label="Tagline" value={data.tagline} onChange={update("tagline")} />
        <Field label="QR Code Data (URL or text)" value={data.qrData} onChange={update("qrData")} />
        <label className="block mb-2 text-xs text-slate-600 font-medium">
          Terms &amp; Conditions
          <div className="text-[10px] text-slate-400 font-normal">Separate multiple bullets with |</div>
          <textarea
            value={data.terms}
            onChange={update("terms")}
            rows={4}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </label>
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
