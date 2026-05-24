"use client";

import { QRCodeSVG } from "qrcode.react";
import type { CardData, CardSide, CardSize } from "@/lib/types";

type Props = {
  data: CardData;
  size: CardSize;
  side: CardSide;
};

const GOLD = "#d4af37";
const DARK = "#0f172a";
const DARK_2 = "#1e293b";

export default function DarkGoldTemplate({ data, size, side }: Props) {
  const cardStyle = {
    width: size.width,
    height: size.height,
    fontSize: `${size.baseFontPx}px`,
    background: DARK,
    color: "#f1f5f9",
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
      {/* Top gold strip with school name */}
      <div
        className="text-center"
        style={{
          background: `linear-gradient(135deg, ${GOLD} 0%, #b8941f 100%)`,
          color: DARK,
          padding: "1em 0.8em",
          borderBottom: `2px solid ${DARK}`,
        }}
      >
        <h2 className="font-extrabold leading-tight" style={{ fontSize: "1.35em", letterSpacing: "1px" }}>
          {data.schoolName}
        </h2>
        <p style={{ fontSize: "0.85em", letterSpacing: "2px", marginTop: "0.2em", opacity: 0.85 }}>
          {data.slogan}
        </p>
      </div>

      {/* Photo square */}
      <div
        className="flex justify-center"
        style={{ background: DARK_2, padding: "1.4em 0", borderBottom: `1px solid ${GOLD}40` }}
      >
        <div
          className="relative overflow-hidden bg-slate-700 flex items-center justify-center"
          style={{
            width: "11.5em",
            height: "11.5em",
            border: `0.25em solid ${GOLD}`,
            borderRadius: "4px",
          }}
        >
          {data.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.photo} alt="photo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ color: GOLD, fontSize: "0.85em", letterSpacing: "1px", fontWeight: 600 }}>
              PHOTO
            </span>
          )}
        </div>
      </div>

      {/* Info table */}
      <div className="flex-1" style={{ padding: "1em 1.2em" }}>
        <DarkInfoRow label="Reg No" value={data.regNo} />
        <DarkInfoRow label="Student ID" value={data.studentId} />
        <DarkInfoRow label="Name" value={data.studentName} accent />
        <DarkInfoRow label="Guardian" value={data.guardian} />
        <DarkInfoRow label="Class" value={data.className} />
        <DarkInfoRow label="Emergency" value={data.emergency} />
      </div>
    </>
  );
}

function Back({ data, size }: { data: CardData; size: CardSize }) {
  const terms = data.terms.split("|").map((s) => s.trim()).filter(Boolean);
  return (
    <>
      <div
        className="text-center font-bold"
        style={{
          background: GOLD,
          color: DARK,
          padding: "0.6em 1em",
          fontSize: "1.05em",
          letterSpacing: "2px",
        }}
      >
        TERMS &amp; CONDITIONS
      </div>

      <ul style={{ padding: "0.8em 1.2em 0.4em", listStyle: "none" }}>
        {terms.map((t, i) => (
          <li
            key={i}
            className="relative"
            style={{
              paddingLeft: "1em",
              fontSize: "0.7em",
              lineHeight: 1.45,
              marginBottom: "0.45em",
              color: "#cbd5e1",
            }}
          >
            <span className="absolute left-0 font-bold" style={{ color: GOLD }}>•</span>
            {t}
          </li>
        ))}
      </ul>

      <div style={{ padding: "0 1.2em", marginBottom: "0.5em" }}>
        <DarkInfoRow label="Phone" value={data.phone} />
        <DarkInfoRow label="Mail" value={data.mail} />
        <DarkInfoRow label="Web" value={data.website} />
      </div>

      <div className="text-center" style={{ padding: "0.3em 0 0.5em" }}>
        <div className="signature-font italic" style={{ color: GOLD, fontSize: "1.6em", lineHeight: 1 }}>
          Signature
        </div>
        <div className="font-bold" style={{ marginTop: "0.2em", fontSize: "0.9em", color: "#f1f5f9" }}>
          {data.principal}
        </div>
      </div>

      <div style={{ padding: "0 1.2em" }}>
        <DarkInfoRow label="Joined" value={data.joinedDate} />
        <DarkInfoRow label="Expire" value={data.expireDate} />
      </div>

      {/* Footer */}
      <div
        className="mt-auto flex items-center justify-between"
        style={{
          background: `linear-gradient(135deg, ${GOLD} 0%, #b8941f 100%)`,
          color: DARK,
          padding: "0.7em 1em",
          borderTop: `2px solid ${DARK}`,
          gap: "0.8em",
        }}
      >
        <div className="flex-1">
          <div className="font-extrabold" style={{ fontSize: "1.15em", letterSpacing: "1px" }}>
            {data.logoText}
          </div>
          <div style={{ fontSize: "0.7em", letterSpacing: "1px", opacity: 0.85 }}>
            {data.tagline}
          </div>
        </div>
        <div className="bg-white rounded flex-shrink-0" style={{ padding: "0.25em" }}>
          <QRCodeSVG value={data.qrData || " "} size={size.baseFontPx * 4} level="M" />
        </div>
      </div>
    </>
  );
}

function DarkInfoRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className="flex"
      style={{
        marginBottom: "0.45em",
        fontSize: "0.9em",
        lineHeight: 1.5,
        paddingBottom: "0.35em",
        borderBottom: `1px solid ${GOLD}30`,
      }}
    >
      <span
        className="font-semibold"
        style={{ flex: "0 0 38%", color: GOLD, textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "0.85em" }}
      >
        {label}
      </span>
      <span
        className={accent ? "font-bold" : ""}
        style={{ flex: 1, color: accent ? "#fff" : "#e2e8f0", wordBreak: "break-word" }}
      >
        {value}
      </span>
    </div>
  );
}
