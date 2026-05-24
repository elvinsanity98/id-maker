"use client";

import { QRCodeSVG } from "qrcode.react";
import type { CardData, CardSide, CardSize } from "@/lib/types";

type Props = {
  data: CardData;
  size: CardSize;
  side: CardSide;
};

export default function BlueWaveTemplate({ data, size, side }: Props) {
  const cardStyle = {
    width: size.width,
    height: size.height,
    fontSize: `${size.baseFontPx}px`,
  } as const;

  return (
    <div className="id-card" style={cardStyle}>
      {side === "front" ? <Front data={data} /> : <Back data={data} size={size} />}
    </div>
  );
}

function Front({ data }: { data: CardData }) {
  return (
    <>
      {/* Header with wave */}
      <div className="relative text-white" style={{ height: "55%", flexShrink: 0 }}>
        <svg
          viewBox="0 0 300 220"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full"
        >
          <path d="M0,0 L300,0 L300,175 Q150,225 0,175 Z" fill="#1e3a8a" />
          <path d="M0,0 L300,0 L300,160 Q150,210 0,160 Z" fill="#2563eb" />
        </svg>
        {data.logo && (
          <div
            className="absolute flex items-center justify-center"
            style={{ top: "0.7em", left: "0.7em", width: "2.8em", height: "2.8em", zIndex: 2 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.logo}
              alt="logo"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
        )}
        <div className="relative text-center" style={{ padding: "1.6em 1em 0" }}>
          <h2 className="font-extrabold leading-tight" style={{ fontSize: "1.45em", letterSpacing: "0.5px" }}>
            {data.schoolName}
          </h2>
          <p style={{ fontSize: "1em", letterSpacing: "1px", marginTop: "0.3em", opacity: 0.95 }}>
            {data.slogan}
          </p>
        </div>
        {/* Photo circle */}
        <div
          className="absolute left-1/2 -translate-x-1/2 overflow-hidden flex items-center justify-center bg-slate-200"
          style={{
            bottom: "-2.8em",
            width: "10.5em",
            height: "10.5em",
            borderRadius: "50%",
            border: "0.35em solid #1e3a8a",
            zIndex: 3,
          }}
        >
          {data.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.photo} alt="photo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span className="font-semibold text-slate-400" style={{ fontSize: "0.85em", letterSpacing: "1px" }}>
              PHOTO
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col justify-center" style={{ padding: "5em 1.3em 1em" }}>
        <InfoRow label="Reg No" value={data.regNo} />
        <InfoRow label="Student ID" value={data.studentId} />
        <InfoRow label="Student Name" value={data.studentName} />
        <InfoRow label="Father/ Guardian" value={data.guardian} />
        <InfoRow label="Class" value={data.className} />
        <InfoRow label="Emergency Call" value={data.emergency} />
      </div>
    </>
  );
}

function Back({ data, size }: { data: CardData; size: CardSize }) {
  const terms = data.terms.split("|").map((s) => s.trim()).filter(Boolean);
  return (
    <>
      <div
        className="bg-blue-600 text-white text-center font-bold rounded"
        style={{ padding: "0.6em 1em", margin: "1em 1.3em 0.8em", fontSize: "1.05em", letterSpacing: "1px" }}
      >
        TERMS AND CONDITIONS
      </div>

      <ul style={{ padding: "0 1.3em", marginBottom: "0.8em", listStyle: "none" }}>
        {terms.map((t, i) => (
          <li
            key={i}
            className="relative text-slate-600"
            style={{ paddingLeft: "1em", fontSize: "0.7em", lineHeight: 1.45, marginBottom: "0.5em" }}
          >
            <span className="absolute left-0 text-blue-600 font-bold">•</span>
            {t}
          </li>
        ))}
      </ul>

      <div style={{ padding: "0 1.3em", marginBottom: "0.6em" }}>
        <InfoRow label="Phone" value={data.phone} />
        <InfoRow label="Mail" value={data.mail} />
        <InfoRow label="Website" value={data.website} />
      </div>

      <div className="text-center" style={{ padding: "0.4em 0 0.6em" }}>
        <div className="signature-font text-slate-800 italic" style={{ fontSize: "1.5em", lineHeight: 1 }}>
          Signature
        </div>
        <div className="font-bold" style={{ marginTop: "0.2em", fontSize: "0.95em" }}>
          {data.principal}
        </div>
      </div>

      <div style={{ padding: "0 1.3em", marginBottom: "0.6em" }}>
        <InfoRow label="Joined Date" value={data.joinedDate} />
        <InfoRow label="Expire Date" value={data.expireDate} />
      </div>

      {/* Footer with wave */}
      <div className="relative mt-auto text-white overflow-hidden" style={{ height: "30%" }}>
        <svg
          viewBox="0 0 300 120"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full"
        >
          <path d="M0,40 Q150,-15 300,40 L300,120 L0,120 Z" fill="#1e3a8a" />
          <path d="M0,55 Q150,0 300,55 L300,120 L0,120 Z" fill="#2563eb" />
        </svg>
        <div
          className="relative flex items-end justify-between h-full"
          style={{ padding: "1.4em 1em 0.8em", gap: "0.8em" }}
        >
          <div className="flex-1 text-center" style={{ paddingBottom: "0.3em" }}>
            {data.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.logo}
                alt="logo"
                style={{ height: "2.4em", maxWidth: "100%", objectFit: "contain", display: "inline-block" }}
              />
            ) : (
              <div className="font-extrabold" style={{ fontSize: "1.2em", letterSpacing: "0.5px" }}>
                {data.logoText}
              </div>
            )}
            <div style={{ fontSize: "0.75em", opacity: 0.9, letterSpacing: "0.5px", marginTop: "0.15em" }}>
              {data.tagline}
            </div>
          </div>
          <div className="bg-white rounded flex-shrink-0" style={{ padding: "0.25em" }}>
            <QRCodeSVG value={data.qrData || " "} size={size.baseFontPx * 4.2} level="M" />
          </div>
        </div>
      </div>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex" style={{ marginBottom: "0.5em", fontSize: "0.95em", lineHeight: 1.5 }}>
      <span className="font-semibold text-slate-800" style={{ flex: "0 0 45%" }}>
        {label}
      </span>
      <span className="font-semibold" style={{ flex: "0 0 0.7em", marginRight: "0.5em" }}>
        :
      </span>
      <span className="text-slate-700 flex-1 break-words">{value}</span>
    </div>
  );
}
