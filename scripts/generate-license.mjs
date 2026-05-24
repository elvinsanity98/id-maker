#!/usr/bin/env node
/**
 * Mint license keys for the ID Card Maker.
 *
 * Usage:
 *   node scripts/generate-license.mjs            # one key
 *   node scripts/generate-license.mjs 5          # five keys
 *
 * The SECRET must match the one in lib/license.ts. If you rotate it,
 * every previously-issued key stops validating.
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

const count = Math.max(1, Math.min(1000, parseInt(process.argv[2] || "1", 10) || 1));
for (let i = 0; i < count; i++) console.log(mintOne());
