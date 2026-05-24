"use client";

import { QRCodeSVG } from "qrcode.react";
import type { CardData, CardSide, CardSize, ColorPalette } from "@/lib/types";

type Props = {
  data: CardData;
  size: CardSize;
  side: CardSide;
  palette: ColorPalette;
};

export default function ModernGradientTemplate({ data, size, side, palette }: Props) {
  const cardStyle = {
    width: size.width,
    height: size.height,
    fontSize: `${size.baseFontPx}px`,
    background: "#ffffff",
    color: "#0f172a",
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

function gradientBg(p: ColorPalette) {
  return `linear-gradient(135deg, ${p.gradientFrom ?? p.primary} 0%, ${p.gradientTo ?? p.secondary} 100%)`;
}

function Front({ data, palette }: { data: CardData; palette: ColorPalette }) {
  const headerPadX = data.logo ? "4em" : "1em";
  return (
    <>
      {/* Gradient header */}
      <div
        className="relative text-white"
        style={{
          height: "42%",
          flexShrink: 0,
          background: gradientBg(palette),
        }}
      >
        {data.logo && (
          <div
            className="absolute flex items-center justify-center"
            style={{
              top: "0.7em",
              left: "0.7em",
              width: "3.6em",
              height: "3.6em",
              padding: "0.3em",
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(4px)",
              borderRadius: "8px",
              zIndex: 2,
            }}
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
          className="relative text-center"
          style={{ padding: `1.4em ${headerPadX} 0`, textShadow: "0 1px 2px rgba(0,0,0,0.15)" }}
        >
          <h2 className="font-extrabold leading-tight" style={{ fontSize: "1.25em", letterSpacing: "0.5px" }}>
            {data.schoolName}
          </h2>
          <p style={{ fontSize: "0.78em", letterSpacing: "1.5px", marginTop: "0.3em", opacity: 0.92, textTransform: "uppercase" }}>
            {data.slogan}
          </p>
        </div>
      </div>

      {/* Photo overlapping the gradient/white boundary */}
      <div
        className="relative flex justify-center"
        style={{ marginTop: "-4.5em", marginBottom: "0.8em", zIndex: 3 }}
      >
        <div
          className="overflow-hidden bg-slate-100 flex items-center justify-center"
          style={{
            width: "10em",
            height: "10em",
            borderRadius: "12px",
            border: "0.4em solid #ffffff",
            boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
          }}
        >
          {data.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.photo} alt="photo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ color: "#94a3b8", fontSize: "0.85em", letterSpacing: "1px", fontWeight: 600 }}>
              PHOTO
            </span>
          )}
        </div>
      </div>

      {/* Info section */}
      <div className="flex-1" style={{ padding: "0.4em 1.4em 1em" }}>
        <ModInfo label="LRN" value={data.lrn} accent={palette.primary} />
        <ModInfo label="Name" value={data.studentName} accent={palette.primary} highlight />
        <ModInfo label="Guardian" value={data.guardian} accent={palette.primary} />
        <ModInfo label="Birthday" value={data.birthday} accent={palette.primary} />
        <ModInfo label="Emergency" value={data.emergency} accent={palette.primary} />
      </div>

      {/* Bottom gradient stripe */}
      <div style={{ background: gradientBg(palette), height: "0.5em", flexShrink: 0 }} />
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
  const terms = data.terms.split("|").map((s) => s.trim()).filter(Boolean);
  return (
    <>
      {/* Small gradient top stripe */}
      <div style={{ background: gradientBg(palette), height: "0.6em", flexShrink: 0 }} />

      <div style={{ padding: "1em 1.3em 0.5em" }}>
        <div
          className="inline-block font-bold uppercase text-white rounded-full"
          style={{
            background: gradientBg(palette),
            padding: "0.35em 1em",
            fontSize: "0.72em",
            letterSpacing: "1.5px",
          }}
        >
          Terms &amp; Conditions
        </div>
        <ul style={{ marginTop: "0.7em", listStyle: "none" }}>
          {terms.map((t, i) => (
            <li
              key={i}
              className="relative"
              style={{
                paddingLeft: "1em",
                fontSize: "0.7em",
                lineHeight: 1.5,
                marginBottom: "0.4em",
                color: "#475569",
              }}
            >
              <span className="absolute left-0 font-bold" style={{ color: palette.primary }}>
                ▸
              </span>
              {t}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ padding: "0 1.3em" }}>
        <ModInfo label="Phone" value={data.phone} accent={palette.primary} />
        <ModInfo label="Mail" value={data.mail} accent={palette.primary} />
        <ModInfo label="Web" value={data.website} accent={palette.primary} />
      </div>

      <div className="text-center" style={{ padding: "0.4em 0 0.4em" }}>
        <div className="signature-font italic" style={{ color: palette.primary, fontSize: "1.5em", lineHeight: 1 }}>
          Signature
        </div>
        <div
          className="font-semibold uppercase"
          style={{ marginTop: "0.2em", fontSize: "0.7em", color: "#64748b", letterSpacing: "1.5px" }}
        >
          {data.principal}
        </div>
      </div>

      <div style={{ padding: "0 1.3em 0.4em" }}>
        <ModInfo label="Joined" value={data.joinedDate} accent={palette.primary} />
        <ModInfo label="Expire" value={data.expireDate} accent={palette.primary} />
      </div>

      {/* Footer */}
      <div
        className="mt-auto relative text-white flex items-center justify-between"
        style={{
          background: gradientBg(palette),
          padding: "0.9em 1.1em",
          gap: "0.8em",
        }}
      >
        <div className="flex-1">
          {data.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.logo}
              alt="logo"
              style={{ height: "2.8em", maxWidth: "100%", objectFit: "contain", display: "inline-block", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))" }}
            />
          ) : (
            <div className="font-extrabold" style={{ fontSize: "1.1em", letterSpacing: "0.5px" }}>
              {data.logoText}
            </div>
          )}
          <div style={{ fontSize: "0.7em", opacity: 0.92, letterSpacing: "1px", marginTop: "0.1em", textTransform: "uppercase" }}>
            {data.tagline}
          </div>
        </div>
        <div className="bg-white rounded flex-shrink-0" style={{ padding: "0.3em" }}>
          <QRCodeSVG value={data.qrData || " "} size={size.baseFontPx * 4} level="M" />
        </div>
      </div>
    </>
  );
}

function ModInfo({
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
      className="flex items-baseline"
      style={{
        marginBottom: "0.35em",
        fontSize: "0.76em",
        lineHeight: 1.5,
        paddingBottom: "0.28em",
        borderBottom: "1px solid #f1f5f9",
      }}
    >
      <span
        className="uppercase font-semibold"
        style={{ flex: "0 0 38%", color: accent, fontSize: "0.82em", letterSpacing: "1px" }}
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
