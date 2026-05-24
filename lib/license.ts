/**
 * License key validation.
 *
 * Format: IDMK-XXXX-XXXX-XXXX-CCCC
 *   - "IDMK" fixed prefix
 *   - 12 random characters split into 3 groups of 4
 *   - 4-character HMAC-SHA256 checksum of the first 4 groups
 *
 * Validation runs entirely in the browser via Web Crypto. This means the
 * SECRET below is visible in the JS bundle — anyone with the source can
 * forge keys. For a real product back this with a server-side check; for
 * a portfolio / small-business demo this is enough friction to keep
 * casual sharing in check.
 *
 * Generating keys for buyers:
 *   - Use the same algorithm (see scripts/generate-license.mjs after you
 *     create one), or paste this code into a Node REPL with `crypto`.
 *   - Each buyer should get a unique key so you can revoke individual ones
 *     later if you migrate to a server-side check.
 */

const SECRET = "idmaker-premium-2026"; // change if you fork
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // omits 0/O/1/I/L for legibility
const PREFIX = "IDMK";
const KEY_REGEX = new RegExp(
  `^${PREFIX}-[${ALPHABET}]{4}-[${ALPHABET}]{4}-[${ALPHABET}]{4}-[${ALPHABET}]{4}$`
);

// Demo / launch promo codes. Keep small; treat like a coupon list.
const PROMO_KEYS: ReadonlySet<string> = new Set([
  "IDMK-DEMO-2026-FREE-TEST",
  "IDMK-LAUN-CHPR-OMO0-2026",
]);

export async function validateLicense(raw: string): Promise<boolean> {
  const key = raw.trim().toUpperCase();
  if (PROMO_KEYS.has(key)) return true;
  if (!KEY_REGEX.test(key)) return false;

  const parts = key.split("-");
  const payload = parts.slice(0, 4).join("-");
  const expected = await hmacChecksum(payload);
  return expected === parts[4];
}

export function isPromoKey(raw: string): boolean {
  return PROMO_KEYS.has(raw.trim().toUpperCase());
}

async function hmacChecksum(data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  const bytes = new Uint8Array(sig);
  let out = "";
  for (let i = 0; i < 4; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

/**
 * Admin helper: produces a fresh valid license key. Call this from the
 * browser devtools (or expose a tiny /admin page) to mint keys after a
 * GCash payment lands. Never expose this function to end users.
 */
export async function generateLicense(): Promise<string> {
  const groups: string[] = [];
  const buf = new Uint8Array(12);
  crypto.getRandomValues(buf);
  for (let g = 0; g < 3; g++) {
    let chunk = "";
    for (let i = 0; i < 4; i++) {
      chunk += ALPHABET[buf[g * 4 + i] % ALPHABET.length];
    }
    groups.push(chunk);
  }
  const payload = `${PREFIX}-${groups.join("-")}`;
  const checksum = await hmacChecksum(payload);
  return `${payload}-${checksum}`;
}
