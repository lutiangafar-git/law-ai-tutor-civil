import { afterEach, describe, expect, it } from "vitest";
import { checkReviewerCode, identifyReviewer, parseReviewerCodes } from "@/lib/reviewerAuth";

const saved = { codes: process.env.REVIEWER_CODES, code: process.env.REVIEWER_CODE };
afterEach(() => {
  if (saved.codes === undefined) delete process.env.REVIEWER_CODES;
  else process.env.REVIEWER_CODES = saved.codes;
  if (saved.code === undefined) delete process.env.REVIEWER_CODE;
  else process.env.REVIEWER_CODE = saved.code;
});

describe("named reviewer passcodes (REVIEWER_CODES)", () => {
  it("reads 'Name: passcode' entries separated by semicolons or new lines", () => {
    expect(parseReviewerCodes("Gafar Lutian: first-passcode; Atty. Maria Cruz: second-passcode\nAtty. Lim: third-passcode")).toEqual([
      { name: "Gafar Lutian", code: "first-passcode" },
      { name: "Atty. Maria Cruz", code: "second-passcode" },
      { name: "Atty. Lim", code: "third-passcode" },
    ]);
  });

  it("keeps colons inside a passcode and ignores entries with a short name or passcode", () => {
    expect(parseReviewerCodes("Ana Reyes: pass:word:123; Al: long-enough-code; Ben Uy: short; no colon here")).toEqual([
      { name: "Ana Reyes", code: "pass:word:123" },
    ]);
  });

  it("identifies which reviewer used their passcode", () => {
    delete process.env.REVIEWER_CODE;
    process.env.REVIEWER_CODES = "Gafar Lutian: first-passcode; Atty. Maria Cruz: second-passcode";
    expect(identifyReviewer("second-passcode")).toEqual({ check: "ok", name: "Atty. Maria Cruz" });
    expect(identifyReviewer("first-passcode")).toEqual({ check: "ok", name: "Gafar Lutian" });
    expect(identifyReviewer("someone-else")).toEqual({ check: "wrong-code", name: null });
  });

  it("still accepts the shared REVIEWER_CODE, without a fixed name", () => {
    process.env.REVIEWER_CODES = "Gafar Lutian: first-passcode";
    process.env.REVIEWER_CODE = "shared-passcode";
    expect(identifyReviewer("shared-passcode")).toEqual({ check: "ok", name: null });
    expect(checkReviewerCode("first-passcode")).toBe("ok");
  });

  it("works with only named passcodes set, and is off when neither setting is valid", () => {
    delete process.env.REVIEWER_CODE;
    process.env.REVIEWER_CODES = "Gafar Lutian: first-passcode";
    expect(checkReviewerCode("first-passcode")).toBe("ok");
    process.env.REVIEWER_CODES = "Al: x";
    expect(checkReviewerCode("x")).toBe("not-set-up");
  });

  it("removing a reviewer locks out only that reviewer", () => {
    delete process.env.REVIEWER_CODE;
    process.env.REVIEWER_CODES = "Gafar Lutian: first-passcode";
    expect(checkReviewerCode("second-passcode")).toBe("wrong-code");
    expect(checkReviewerCode("first-passcode")).toBe("ok");
  });
});
