"use client";

import { QRCodeSVG } from "qrcode.react";
import type { CardData, CardSide, CardSize, ColorPalette } from "@/lib/types";

type Props = {
  data: CardData;
  size: CardSize;
  side: CardSide;
  palette: ColorPalette;
};

// Slightly lighter than the dark background, used for the photo bay.
const PHOTO_BAY = "#1e293b";

// Darken a hex by ~15% so the gradient strip still has a subtle two-stop look.
function darken(hex: string, amount = 0.15): string {
  const m = hex.replace("#", "");
  const num = parseInt(m, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.max(0, Math.floor(r * (1 - amount)));
  g = Math.max(0, Math.floor(g * (1 - amount)));
  b = Math.max(0, Math.floor(b * (1 - amount)));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export default function DarkGoldTemplate({ data, size, side, palette }: Props) {
  const cardStyle = {
    width: size.width,
    height: size.height,
    fontSize: `${size.baseFontPx}px`,
    background: palette.secondary,
    color: "#f1f5f9",
  } as const;

  return (
    <div className="id-card" style={cardStyle}>
      {side === "front" ? (
        <Front data={data} palette={palette} />
      ) : (
        <Back data={data} size={size} palette={palette} />
      )}
    </div>
  );
}

function Front({ data, palette }: { data: CardData; palette: ColorPalette }) {
  const accent = palette.primary;
  const dark = palette.secondary;
  // Strip padding leaves room for the logo on the left without clipping the
  // centered school name.
  const stripPadX = data.logo ? "3.6em" : "0.8em";
  return (
    <>
      {/* Top accent strip with school name */}
      <div
        className="relative text-center"
        style={{
          background: `linear-gradient(135deg, ${accent} 0%, ${darken(accent, 0.2)} 100%)`,
          color: dark,
          padding: `1em ${stripPadX}`,
          borderBottom: `2px solid ${dark}`,
        }}
      >
        {data.logo && (
          <div
            className="absolute flex items-center justify-center"
            style={{ top: "0.5em", left: "0.7em", width: "3.4em", height: "3.4em" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.logo}
              alt="logo"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
        )}
        <h2 className="font-extrabold leading-tight" style={{ fontSize: "1.15em", letterSpacing: "1px" }}>
          {data.schoolName}
        </h2>
        <p style={{ fontSize: "0.72em", letterSpacing: "2px", marginTop: "0.2em", opacity: 0.85 }}>
          {data.slogan}
        </p>
      </div>

      {/* Photo square */}
      <div
        className="flex justify-center"
        style={{ background: PHOTO_BAY, padding: "1.4em 0", borderBottom: `1px solid ${accent}40` }}
      >
        <div
          className="relative overflow-hidden bg-slate-700 flex items-center justify-center"
          style={{
            width: "13em",
            height: "13em",
            border: `0.25em solid ${accent}`,
            borderRadius: "4px",
          }}
        >
          {data.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.photo} alt="photo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ color: accent, fontSize: "0.85em", letterSpacing: "1px", fontWeight: 600 }}>
              PHOTO
            </span>
          )}
        </div>
      </div>

      {/* Info table */}
      <div className="flex-1" style={{ padding: "1em 1.2em" }}>
        <DarkInfoRow label="LRN" value={data.lrn} accent={accent} />
        <DarkInfoRow label="Name" value={data.studentName} accent={accent} highlight />
        <DarkInfoRow label="Guardian" value={data.guardian} accent={accent} />
        <DarkInfoRow label="Birthday" value={data.birthday} accent={accent} />
        <DarkInfoRow label="Emergency" value={data.emergency} accent={accent} />
      </div>
    </>
  );
}

function Back({
  data,
  size,
  palette,
}: {
  data: CardData;
  size: CardSize;
  palette: ColorPalette;
}) {
  const accent = palette.primary;
  const dark = palette.secondary;
  const terms = data.terms.split("|").map((s) => s.trim()).filter(Boolean);
  return (
    <>
      <div
        className="text-center font-bold"
        style={{
          background: accent,
          color: dark,
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
            <span className="absolute left-0 font-bold" style={{ color: accent }}>
              •
            </span>
            {t}
          </li>
        ))}
      </ul>

      <div style={{ padding: "0 1.2em", marginBottom: "0.5em" }}>
        <DarkInfoRow label="Phone" value={data.phone} accent={accent} />
        <DarkInfoRow label="Mail" value={data.mail} accent={accent} />
        <DarkInfoRow label="Web" value={data.website} accent={accent} />
      </div>

      <div className="text-center" style={{ padding: "0.3em 0 0.5em" }}>
        <div className="signature-font italic" style={{ color: accent, fontSize: "1.6em", lineHeight: 1 }}>
          Signature
        </div>
        <div className="font-bold" style={{ marginTop: "0.2em", fontSize: "0.9em", color: "#f1f5f9" }}>
          {data.principal}
        </div>
      </div>

      <div style={{ padding: "0 1.2em" }}>
        <DarkInfoRow label="Joined" value={data.joinedDate} accent={accent} />
        <DarkInfoRow label="Expire" value={data.expireDate} accent={accent} />
      </div>

      {/* Footer */}
      <div
        className="mt-auto flex items-center justify-between"
        style={{
          background: `linear-gradient(135deg, ${accent} 0%, ${darken(accent, 0.2)} 100%)`,
          color: dark,
          padding: "0.7em 1em",
          borderTop: `2px solid ${dark}`,
          gap: "0.8em",
        }}
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
            <div className="font-extrabold" style={{ fontSize: "1.15em", letterSpacing: "1px" }}>
              {data.logoText}
            </div>
          )}
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

function DarkInfoRow({
  label,
  value,
  accent,
  highlight,
}: {
  label: string;
  value: string;
  accent: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="flex"
      style={{
        marginBottom: "0.4em",
        fontSize: "0.78em",
        lineHeight: 1.5,
        paddingBottom: "0.3em",
        borderBottom: `1px solid ${accent}30`,
      }}
    >
      <span
        className="font-semibold"
        style={{ flex: "0 0 38%", color: accent, textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "0.85em" }}
      >
        {label}
      </span>
      <span
        className={highlight ? "font-bold" : ""}
        style={{ flex: 1, color: highlight ? "#fff" : "#e2e8f0", wordBreak: "break-word" }}
      >
        {value}
      </span>
    </div>
  );
}
