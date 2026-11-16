import { createHash, timingSafeEqual } from "crypto";

/**
 * The reviewer pages are protected by passcodes set in Vercel. Two settings, either or both:
 *
 *  - REVIEWER_CODES: one named passcode per reviewer, so every approval records who approved it.
 *      Format: "Name: passcode" entries separated by semicolons or new lines, e.g.
 *      "Gafar Lutian: first-passcode; Atty. Maria Cruz: second-passcode"
 *      Add or remove a reviewer by editing this one setting; the others are not affected.
 *  - REVIEWER_CODE: one shared passcode (the original setting). Whoever uses it types their name.
 *
 * Each passcode needs at least 8 characters; names at least 3. If neither is set, the reviewer tools are off.
 */
export type ReviewerCheck = "ok" | "not-set-up" | "wrong-code";

export type NamedReviewer = { name: string; code: string };

const MIN_CODE = 8;
const MIN_NAME = 3;

/** Reads REVIEWER_CODES ("Name: passcode; Name: passcode"). Entries with a short name or passcode are ignored. */
export function parseReviewerCodes(raw: string | undefined): NamedReviewer[] {
  const out: NamedReviewer[] = [];
  for (const entry of String(raw ?? "").split(/[;\n]+/)) {
    const i = entry.indexOf(":");
    if (i < 0) continue;
    const name = entry
      .slice(0, i)
      .replace(/[\r\n\t"\\#]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80);
    const code = entry.slice(i + 1).trim();
    if (name.length >= MIN_NAME && code.length >= MIN_CODE) out.push({ name, code });
  }
  return out;
}

function same(given: string, expected: string): boolean {
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/**
 * Checks a passcode. `name` is the reviewer's name when a named passcode (REVIEWER_CODES) matched,
 * or null for the shared REVIEWER_CODE (the reviewer then types a name).
 */
export function identifyReviewer(given: unknown): { check: ReviewerCheck; name: string | null } {
  const code = String(given ?? "");
  const named = parseReviewerCodes(process.env.REVIEWER_CODES);
  const shared = (process.env.REVIEWER_CODE ?? "").trim();
  const sharedOn = shared.length >= MIN_CODE;
  if (named.length === 0 && !sharedOn) return { check: "not-set-up", name: null };

  let match: string | null = null;
  for (const r of named) if (same(code, r.code) && match === null) match = r.name; // compare all, no early exit
  if (match !== null) return { check: "ok", name: match };
  if (sharedOn && same(code, shared)) return { check: "ok", name: null };
  return { check: "wrong-code", name: null };
}

export function checkReviewerCode(given: unknown): ReviewerCheck {
  return identifyReviewer(given).check;
}

export const REVIEWER_MESSAGES: Record<Exclude<ReviewerCheck, "ok">, { status: number; error: string }> = {
  "not-set-up": {
    status: 503,
    error:
      "The reviewer tools are switched off. Set REVIEWER_CODES (one 'Name: passcode' per reviewer) or REVIEWER_CODE (at least 8 characters) in Vercel to switch them on.",
  },
  "wrong-code": { status: 401, error: "Wrong reviewer passcode." },
};
