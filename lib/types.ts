export type CardData = {
  schoolName: string;
  slogan: string;
  lrn: string;
  studentName: string;
  guardian: string;
  birthday: string;
  emergency: string;
  phone: string;
  mail: string;
  website: string;
  principal: string;
  joinedDate: string;
  expireDate: string;
  logoText: string;
  tagline: string;
  qrData: string;
  terms: string;
  photo: string | null;
  logo: string | null;
};

export type CardSize = {
  id: string;
  label: string;
  width: string;
  height: string;
  baseFontPx: number;
};

export const CARD_SIZES: CardSize[] = [
  { id: "cr80", label: 'CR80 Portrait — 2.125" × 3.375" (credit-card)', width: "2.125in", height: "3.375in", baseFontPx: 8 },
  { id: "medium", label: 'Medium Portrait — 2.5" × 4"', width: "2.5in", height: "4in", baseFontPx: 10 },
  { id: "large", label: 'Large Portrait — 3" × 4"', width: "3in", height: "4in", baseFontPx: 11 },
  { id: "event", label: 'Event Badge — 3.5" × 5"', width: "3.5in", height: "5in", baseFontPx: 13 },
  { id: "a7", label: 'A7 — 2.91" × 4.13"', width: "2.91in", height: "4.13in", baseFontPx: 11 },
  { id: "a6", label: 'A6 — 4.13" × 5.83"', width: "4.13in", height: "5.83in", baseFontPx: 15 },
];

export type TemplateId = "blue-wave" | "dark-gold" | "minimal" | "modern-gradient";

export type TemplateOption = {
  id: TemplateId;
  label: string;
  description: string;
};

export const TEMPLATES: TemplateOption[] = [
  { id: "blue-wave", label: "Blue Wave", description: "Modern gradient header with wave curves" },
  { id: "dark-gold", label: "Dark Elegance", description: "Corporate dark with metallic accents" },
  { id: "minimal", label: "Minimal", description: "Clean, modern, lots of whitespace" },
  { id: "modern-gradient", label: "Modern Gradient", description: "Vivid diagonal gradient with square photo" },
];

export type ColorPalette = {
  id: string;
  label: string;
  primary: string;
  secondary: string;
  gradientFrom?: string;
  gradientTo?: string;
};

export const PALETTES: Record<TemplateId, ColorPalette[]> = {
  "blue-wave": [
    { id: "ocean", label: "Ocean Blue", primary: "#2563eb", secondary: "#1e3a8a" },
    { id: "forest", label: "Forest Green", primary: "#16a34a", secondary: "#14532d" },
    { id: "royal", label: "Royal Purple", primary: "#7c3aed", secondary: "#4c1d95" },
    { id: "crimson", label: "Crimson Red", primary: "#dc2626", secondary: "#7f1d1d" },
    { id: "teal", label: "Teal Wave", primary: "#0d9488", secondary: "#134e4a" },
  ],
  "dark-gold": [
    { id: "gold", label: "Classic Gold", primary: "#d4af37", secondary: "#0f172a" },
    { id: "silver", label: "Cool Silver", primary: "#c0c0c0", secondary: "#0f172a" },
    { id: "bronze", label: "Warm Bronze", primary: "#cd7f32", secondary: "#1c1917" },
    { id: "rose-gold", label: "Rose Gold", primary: "#b76e79", secondary: "#1c1917" },
  ],
  minimal: [
    { id: "rose", label: "Rose", primary: "#e11d48", secondary: "#9f1239" },
    { id: "emerald", label: "Emerald", primary: "#10b981", secondary: "#065f46" },
    { id: "indigo", label: "Indigo", primary: "#6366f1", secondary: "#3730a3" },
    { id: "amber", label: "Amber", primary: "#f59e0b", secondary: "#92400e" },
    { id: "cyan", label: "Cyan", primary: "#06b6d4", secondary: "#0e7490" },
  ],
  "modern-gradient": [
    { id: "purple-pink", label: "Purple Pink", primary: "#9333ea", secondary: "#ec4899", gradientFrom: "#9333ea", gradientTo: "#ec4899" },
    { id: "teal-blue", label: "Teal Blue", primary: "#06b6d4", secondary: "#3b82f6", gradientFrom: "#06b6d4", gradientTo: "#3b82f6" },
    { id: "orange-red", label: "Orange Red", primary: "#f97316", secondary: "#dc2626", gradientFrom: "#f97316", gradientTo: "#dc2626" },
    { id: "green-cyan", label: "Green Cyan", primary: "#16a34a", secondary: "#06b6d4", gradientFrom: "#16a34a", gradientTo: "#06b6d4" },
    { id: "sunset", label: "Sunset", primary: "#fb923c", secondary: "#c026d3", gradientFrom: "#fb923c", gradientTo: "#c026d3" },
  ],
};

export function defaultPalette(t: TemplateId): ColorPalette {
  return PALETTES[t][0];
}

export type CardSide = "front" | "back";

export const DEFAULT_DATA: CardData = {
  schoolName: "ABC SCHOOL NAME",
  slogan: "SLOGAN HERE",
  lrn: "123456789012",
  studentName: "Name Here",
  guardian: "Name Here",
  birthday: "DD/MM/YYYY",
  emergency: "123-456-7890",
  phone: "123-456-7890",
  mail: "urmail@email.com",
  website: "www.urweb.com",
  principal: "Principal",
  joinedDate: "DD/MM/YEAR",
  expireDate: "DD/MM/YEAR",
  logoText: "LOGO HERE",
  tagline: "TAGLINE HERE",
  qrData: "https://urweb.com",
  terms:
    "Lorem ipsum dolors sit amets, the a into a for consectetuer adipiscing elit, sed the a diam nonumys nibh Lorem ipsums.|Lorem ipsum dolors sit amets, the a into a for consectetuer adipiscing elit.",
  photo: null,
  logo: null,
};
