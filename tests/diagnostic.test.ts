import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { BAR_EXAM } from "@/lib/barExam";
import {
  DIAGNOSTIC_FILE,
  DIAGNOSTIC_SIZE,
  normalizeVerdict,
  parseDiagnosticBank,
  pickDiagnostic,
  summarizeDiagnostic,
  toClientDiagnosticItem,
} from "@/lib/diagnostic";
import { SUBJECT } from "@/lib/subject";

const bank = parseDiagnosticBank(
  fs.readFileSync(path.join(process.cwd(), "sources", DIAGNOSTIC_FILE), "utf8"),
);

describe("diagnostic bank (sources/_diagnostic.md)", () => {
  it(`has enough questions for a ${DIAGNOSTIC_SIZE}-question diagnostic, with unique ids`, () => {
    expect(bank.length).toBeGreaterThanOrEqual(DIAGNOSTIC_SIZE);
    expect(new Set(bank.map((i) => i.id)).size).toBe(bank.length);
  });

  it.each(bank.map((i) => [i.id, i] as const))("%s is complete and within this subject and syllabus", (_id, item) => {
    expect(SUBJECT.areas, `${item.id} area`).toContain(item.area);
    expect(item.syllabusYear).toBe(BAR_EXAM.year);
    expect(item.syllabusRef).toMatch(/^[IVXL]+(\.[A-Za-z0-9]+)*$/);
    for (const f of ["askedIn", "question", "answer", "citation", "law"] as const) {
      expect(item[f].length, `${item.id} ${f}`).toBeGreaterThan(10);
    }
    expect(item.keyPoints.length).toBeGreaterThanOrEqual(2);
  });

  it("the browser never receives answers, key points or the law text", () => {
    const client = toClientDiagnosticItem(bank[0]) as unknown as Record<string, unknown>;
    expect(client.answer).toBeUndefined();
    expect(client.keyPoints).toBeUndefined();
    expect(client.law).toBeUndefined();
  });
});

describe("picking 20 at random", () => {
  it("returns 20 different questions spread across areas", () => {
    let seed = 7;
    const random = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    const picked = pickDiagnostic(bank, DIAGNOSTIC_SIZE, random);
    expect(picked).toHaveLength(Math.min(DIAGNOSTIC_SIZE, bank.length));
    expect(new Set(picked.map((i) => i.id)).size).toBe(picked.length);
    const areasInBank = new Set(bank.map((i) => i.area));
    const areasPicked = new Set(picked.map((i) => i.area));
    expect(areasPicked.size).toBe(Math.min(areasInBank.size, DIAGNOSTIC_SIZE));
  });

  it("differs between runs", () => {
    const a = pickDiagnostic(bank).map((i) => i.id).join();
    const b = pickDiagnostic(bank).map((i) => i.id).join();
    const c = pickDiagnostic(bank).map((i) => i.id).join();
    expect(new Set([a, b, c]).size).toBeGreaterThan(1);
  });
});

describe("areas to improve", () => {
  it("scores 2/1/0 per verdict and lists the weakest area first", () => {
    const s = summarizeDiagnostic([
      { itemId: "1", area: "Sales", verdict: "correct" },
      { itemId: "2", area: "Sales", verdict: "correct" },
      { itemId: "3", area: "Succession", verdict: "not yet" },
      { itemId: "4", area: "Succession", verdict: "partly correct" },
    ]);
    expect(s[0]).toMatchObject({ area: "Succession", percent: 25, level: "Needs work" });
    expect(s[1]).toMatchObject({ area: "Sales", percent: 100, level: "Strong" });
  });

  it("reads the model's verdict safely", () => {
    expect(normalizeVerdict("Correct")).toBe("correct");
    expect(normalizeVerdict("partly")).toBe("partly correct");
    expect(normalizeVerdict(undefined)).toBe("not yet");
  });
});
