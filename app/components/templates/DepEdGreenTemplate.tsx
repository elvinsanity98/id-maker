"use client";

import { QRCodeSVG } from "qrcode.react";
import type { CardData, CardSide, CardSize, ColorPalette } from "@/lib/types";

type Props = {
  data: CardData;
  size: CardSize;
  side: CardSide;
  palette: ColorPalette;
};

export default function DepEdGreenTemplate({ data, size, side, palette }: Props) {
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

function Header({ data, palette }: { data: CardData; palette: ColorPalette }) {
  return (
    <div
      className="flex items-center gap-1 text-center"
      style={{ padding: "0.6em 0.6em 0.4em", borderBottom: `2px solid ${palette.primary}` }}
    >
      <Seal img={data.logo} fallback="DepEd" palette={palette} />
      <div className="flex-1 leading-tight" style={{ color: palette.secondary }}>
        <div style={{ fontSize: "0.55em", letterSpacing: "0.5px" }}>
          Republic of the Philippines
        </div>
        <div style={{ fontSize: "0.55em" }}>Department of Education</div>
        <div className="font-extrabold" style={{ fontSize: "0.82em", color: palette.primary, marginTop: "0.1em" }}>
          {data.schoolName}
        </div>
        <div style={{ fontSize: "0.5em", letterSpacing: "0.5px" }}>{data.slogan}</div>
      </div>
      <Seal img={data.logo} fallback="LOGO" palette={palette} />
    </div>
  );
}

function Seal({
  img,
  fallback,
  palette,
}: {
  img: string | null;
  fallback: string;
  palette: ColorPalette;
}) {
  return (
    <div
      className="flex items-center justify-center flex-shrink-0 overflow-hidden rounded-full"
      style={{
        width: "2.6em",
        height: "2.6em",
        border: `1.5px solid ${palette.primary}`,
        background: "#f0fdf4",
      }}
    >
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt="seal" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      ) : (
        <span style={{ fontSize: "0.5em", fontWeight: 700, color: palette.primary }}>{fallback}</span>
      )}
    </div>
  );
}

function Front({ data, palette }: { data: CardData; palette: ColorPalette }) {
  return (
    <>
      <Header data={data} palette={palette} />

      <div className="flex-1 flex flex-col items-center" style={{ padding: "0.8em 1em 0.4em" }}>
        {/* Square photo with maroon frame */}
        <div
          className="overflow-hidden bg-slate-100 flex items-center justify-center"
          style={{
            width: "9.5em",
            height: "10.5em",
            border: "0.3em solid #7f1d1d",
            borderRadius: "3px",
          }}
        >
          {data.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.photo} alt="photo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ color: "#94a3b8", fontSize: "0.8em", fontWeight: 600, letterSpacing: "1px" }}>
              PHOTO
            </span>
          )}
        </div>

        <div
          className="font-extrabold text-center"
          style={{ fontSize: "1.05em", marginTop: "0.5em", color: "#0f172a", letterSpacing: "0.3px" }}
        >
          {data.studentName}
        </div>
        <div style={{ fontSize: "0.72em", color: "#475569", marginTop: "0.1em", fontWeight: 600 }}>
          LRN: {data.lrn}
        </div>

        <div
          className="font-bold text-white text-center"
          style={{
            background: palette.primary,
            borderRadius: "999px",
            padding: "0.2em 1em",
            fontSize: "0.65em",
            letterSpacing: "1px",
            marginTop: "0.5em",
          }}
        >
          {data.gradeSection}
        </div>
      </div>

      {/* QR (encodes LRN for attendance scanning) */}
      <div
        className="flex items-center justify-between"
        style={{ padding: "0.3em 1em 0.7em" }}
      >
        <div className="bg-white" style={{ border: `1px solid ${palette.primary}`, padding: "0.15em", borderRadius: "3px" }}>
          <QRCodeSVG value={data.lrn || data.qrData || " "} size={54} level="M" />
        </div>
        <div className="text-right" style={{ fontSize: "0.5em", color: palette.secondary, lineHeight: 1.3 }}>
          <div className="font-bold" style={{ color: palette.primary }}>SCAN FOR</div>
          <div>ATTENDANCE</div>
        </div>
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
  return (
    <>
      <Header data={data} palette={palette} />

      <div
        className="text-center font-bold"
        style={{ color: palette.secondary, fontSize: "0.7em", padding: "0.5em 1em 0.2em", letterSpacing: "0.5px" }}
      >
        VALIDITY: {data.validity}
      </div>

      <div
        className="text-center font-bold text-white"
        style={{
          background: palette.primary,
          padding: "0.35em 1em",
          fontSize: "0.65em",
          letterSpacing: "1px",
          margin: "0.3em 0.8em",
          borderRadius: "3px",
        }}
      >
        DETAILS OF EMERGENCY PLEASE NOTIFY
      </div>

      <div className="flex-1 text-center" style={{ padding: "0.4em 1em" }}>
        <div className="font-bold" style={{ fontSize: "0.95em", color: "#0f172a" }}>
          {data.guardian}
        </div>
        <div style={{ fontSize: "0.62em", color: "#64748b", letterSpacing: "1px", marginTop: "0.1em" }}>
          NAME
        </div>

        <div className="font-medium" style={{ fontSize: "0.78em", color: "#334155", marginTop: "0.5em" }}>
          {data.address}
        </div>
        <div style={{ fontSize: "0.62em", color: "#64748b", letterSpacing: "1px", marginTop: "0.1em" }}>
          ADDRESS
        </div>

        <div className="font-bold" style={{ fontSize: "0.9em", color: palette.primary, marginTop: "0.5em" }}>
          {data.phone}
        </div>
        <div style={{ fontSize: "0.62em", color: "#64748b", letterSpacing: "1px", marginTop: "0.1em" }}>
          CONTACT NUMBER
        </div>

        <div style={{ marginTop: "0.9em" }}>
          {data.signature ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.signature}
              alt="signature"
              style={{ height: "2.4em", maxWidth: "70%", objectFit: "contain", display: "inline-block" }}
            />
          ) : (
            <div className="signature-font italic" style={{ color: "#0f172a", fontSize: "1.4em", lineHeight: 1 }}>
              Signature
            </div>
          )}
          <div className="font-bold" style={{ fontSize: "0.78em", color: "#0f172a", marginTop: "0.1em" }}>
            {data.principal}
          </div>
          <div style={{ fontSize: "0.6em", color: "#64748b", letterSpacing: "1px" }}>
            SCHOOL PRINCIPAL
          </div>
        </div>
      </div>

      <div
        className="text-center font-extrabold text-white"
        style={{ background: palette.primary, padding: "0.4em 1em", fontSize: "0.78em", letterSpacing: "3px" }}
      >
        NON-TRANSFERABLE
      </div>
    </>
  );
}
