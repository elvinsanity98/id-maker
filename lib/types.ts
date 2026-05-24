export type CardData = {
  schoolName: string;
  slogan: string;
  regNo: string;
  studentId: string;
  studentName: string;
  guardian: string;
  className: string;
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

export type TemplateId = "blue-wave" | "dark-gold" | "minimal";

export type TemplateOption = {
  id: TemplateId;
  label: string;
  description: string;
};

export const TEMPLATES: TemplateOption[] = [
  { id: "blue-wave", label: "Blue Wave", description: "Modern blue gradient with wave curves" },
  { id: "dark-gold", label: "Dark Elegance", description: "Corporate dark with gold accents" },
  { id: "minimal", label: "Minimal", description: "Clean, modern, lots of whitespace" },
];

export type CardSide = "front" | "back";

export const DEFAULT_DATA: CardData = {
  schoolName: "ABC SCHOOL NAME",
  slogan: "SLOGAN HERE",
  regNo: "123456",
  studentId: "1234",
  studentName: "Name Here",
  guardian: "Name Here",
  className: "Class Here",
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
