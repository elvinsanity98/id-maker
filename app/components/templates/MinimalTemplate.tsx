"use client";

import { QRCodeSVG } from "qrcode.react";
import type { CardData, CardSide, CardSize } from "@/lib/types";

type Props = {
  data: CardData;
  size: CardSize;
  side: CardSide;
};

const ACCENT = "#e11d48"; // rose-600

export default function MinimalTemplate({ data, size, side }: Props) {
  const cardStyle = {
    width: size.width,
    height: size.height,
    fontSize: `${size.baseFontPx}px`,
    background: "#fff",
    color: "#0f172a",
  } as const;

  return (
    <div className="id-card" style={cardStyle}>
      {/* Accent stripe at top */}
      <div style={{ background: ACCENT, height: "0.4em", flexShrink: 0 }} />
      {side === "front" ? <Front data={data} /> : <Back data={data} size={size} />}
    </div>
  );
}

function Front({ data }: { data: CardData }) {
  return (
    <>
      <div className="relative" style={{ padding: "1.2em 1.2em 0.6em" }}>
        {data.logo && (
          <div
            className="absolute flex items-center justify-center"
            style={{ top: "0.9em", right: "1em", width: "3.6em", height: "3.6em" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.logo}
              alt="logo"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
        )}
        <div
          className="font-bold uppercase"
          style={{ fontSize: "0.7em", letterSpacing: "2px", color: ACCENT }}
        >
          STUDENT ID
        </div>
        <h2
          className="font-extrabold leading-tight"
          style={{ fontSize: "1.1em", marginTop: "0.2em", color: "#0f172a", paddingRight: data.logo ? "4.2em" : 0 }}
        >
          {data.schoolName}
        </h2>
        <p style={{ fontSize: "0.7em", color: "#64748b", marginTop: "0.15em", paddingRight: data.logo ? "4.2em" : 0 }}>
          {data.slogan}
        </p>
      </div>

      <div className="flex justify-center" style={{ padding: "0.6em 0 1em" }}>
        <div
          className="relative overflow-hidden bg-slate-100 flex items-center justify-center"
          style={{
            width: "13em",
            height: "13em",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
          }}
        >
          {data.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.photo} alt="photo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ color: "#94a3b8", fontSize: "0.8em", letterSpacing: "1px", fontWeight: 600 }}>
              PHOTO
            </span>
          )}
        </div>
      </div>

      <div className="flex-1" style={{ padding: "0 1.2em 1em" }}>
        <MinInfo label="LRN" value={data.lrn} />
        <MinInfo label="Name" value={data.studentName} highlight />
        <MinInfo label="Guardian" value={data.guardian} />
        <MinInfo label="Birthday" value={data.birthday} />
        <MinInfo label="Emergency" value={data.emergency} />
      </div>

      {/* Bottom accent stripe */}
      <div style={{ background: ACCENT, height: "0.3em", flexShrink: 0 }} />
    </>
  );
}

function Back({ data, size }: { data: CardData; size: CardSize }) {
  const terms = data.terms.split("|").map((s) => s.trim()).filter(Boolean);
  return (
    <>
      <div style={{ padding: "1.2em 1.2em 0.6em" }}>
        <div
          className="font-bold uppercase"
          style={{ fontSize: "0.7em", letterSpacing: "2px", color: ACCENT }}
        >
          TERMS &amp; CONDITIONS
        </div>
        <ul style={{ marginTop: "0.5em", listStyle: "none" }}>
          {terms.map((t, i) => (
            <li
              key={i}
              className="relative"
              style={{
                paddingLeft: "0.9em",
                fontSize: "0.7em",
                lineHeight: 1.5,
                marginBottom: "0.4em",
                color: "#475569",
              }}
            >
              <span className="absolute left-0" style={{ color: ACCENT, fontWeight: 700 }}>—</span>
              {t}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ padding: "0 1.2em" }}>
        <MinInfo label="Phone" value={data.phone} />
        <MinInfo label="Mail" value={data.mail} />
        <MinInfo label="Web" value={data.website} />
      </div>

      <div className="text-center" style={{ padding: "0.6em 0 0.4em" }}>
        <div className="signature-font italic" style={{ color: "#0f172a", fontSize: "1.5em", lineHeight: 1 }}>
          Signature
        </div>
        <div
          className="font-semibold uppercase"
          style={{ marginTop: "0.2em", fontSize: "0.7em", color: "#64748b", letterSpacing: "1.5px" }}
        >
          {data.principal}
        </div>
      </div>

      <div style={{ padding: "0 1.2em" }}>
        <MinInfo label="Joined" value={data.joinedDate} />
        <MinInfo label="Expire" value={data.expireDate} />
      </div>

      <div
        className="mt-auto flex items-center justify-between"
        style={{ padding: "0.8em 1.2em", borderTop: "1px solid #e2e8f0", gap: "0.8em" }}
      >
        <div className="flex-1">
          {data.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.logo}
              alt="logo"
              style={{ height: "2.8em", maxWidth: "100%", objectFit: "contain", display: "inline-block" }}
            />
          ) : (
            <div className="font-extrabold" style={{ fontSize: "1.05em", color: "#0f172a" }}>
              {data.logoText}
            </div>
          )}
          <div style={{ fontSize: "0.7em", color: "#64748b", letterSpacing: "0.5px" }}>
            {data.tagline}
          </div>
        </div>
        <div className="flex-shrink-0" style={{ padding: "0.2em", border: "1px solid #e2e8f0", borderRadius: "4px" }}>
          <QRCodeSVG value={data.qrData || " "} size={size.baseFontPx * 4} level="M" />
        </div>
      </div>

      <div style={{ background: ACCENT, height: "0.3em", flexShrink: 0 }} />
    </>
  );
}

function MinInfo({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="flex"
      style={{
        marginBottom: "0.35em",
        fontSize: "0.74em",
        lineHeight: 1.5,
        paddingBottom: "0.28em",
        borderBottom: "1px solid #f1f5f9",
      }}
    >
      <span
        className="uppercase"
        style={{ flex: "0 0 40%", color: "#94a3b8", fontSize: "0.8em", letterSpacing: "1px", fontWeight: 600 }}
      >
        {label}
      </span>
      <span
        className={highlight ? "font-bold" : "font-medium"}
        style={{ flex: 1, color: highlight ? "#0f172a" : "#334155", wordBreak: "break-word" }}
      >
        {value}
      </span>
    </div>
  );
}
