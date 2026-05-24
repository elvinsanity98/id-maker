#!/usr/bin/env node
/**
 * Mint license keys for the ID Card Maker.
 *
 * Usage:
 *   node scripts/generate-license.mjs                 # 1 key, plain
 *   node scripts/generate-license.mjs 5               # 5 keys, plain
 *   node scripts/generate-license.mjs 5 --sql         # 5 keys + INSERT statements
 *   node scripts/generate-license.mjs 5 --sql --note "Launch promo"
 *
 * Keys are HMAC-checksummed with the same SECRET as lib/license.ts. After
 * minting, paste the SQL output into your Supabase SQL Editor to register
 * them in the license_keys table — until they're inserted there, the
 * activate_license_key RPC will reject them as "not recognized".
 */
import { createHmac, randomBytes } from "node:crypto";

const SECRET = "idmaker-premium-2026";
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const PREFIX = "IDMK";

function mintOne() {
  const buf = randomBytes(12);
  const groups = [];
  for (let g = 0; g < 3; g++) {
    let chunk = "";
    for (let i = 0; i < 4; i++) chunk += ALPHABET[buf[g * 4 + i] % ALPHABET.length];
    groups.push(chunk);
  }
  const payload = `${PREFIX}-${groups.join("-")}`;
  const sig = createHmac("sha256", SECRET).update(payload).digest();
  let checksum = "";
  for (let i = 0; i < 4; i++) checksum += ALPHABET[sig[i] % ALPHABET.length];
  return `${payload}-${checksum}`;
}

// Crude arg parser: number is the count, everything else is a flag.
const args = process.argv.slice(2);
const sqlMode = args.includes("--sql");
const noteIdx = args.indexOf("--note");
const note = noteIdx !== -1 ? args[noteIdx + 1] : null;
const numArg = args.find((a) => /^\d+$/.test(a));
const count = Math.max(1, Math.min(1000, parseInt(numArg || "1", 10)));

const keys = Array.from({ length: count }, mintOne);

if (sqlMode) {
  console.log("-- Paste into Supabase SQL Editor:");
  console.log("INSERT INTO public.license_keys (key, notes) VALUES");
  console.log(
    keys
      .map((k, i) => `  ('${k}', ${note ? `'${note.replace(/'/g, "''")}'` : "NULL"})${i === keys.length - 1 ? ";" : ","}`)
      .join("\n")
  );
} else {
  for (const k of keys) console.log(k);
}
