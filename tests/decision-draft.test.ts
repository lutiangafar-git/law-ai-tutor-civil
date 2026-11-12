import fs from "fs";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import {
  checkDecisionUrl,
  cutoffStatus,
  decodeHtmlBytes,
  extractDecisionMeta,
  htmlToText,
  toISODate,
} from "@/lib/decisions";
import { casesMissingCitation, checkDraft, longestSharedRun, yearLevelsFor } from "@/lib/draftCheck";
import { enforceDraftHeader } from "@/lib/prompts/decisionDraft";
import { checkReviewerCode } from "@/lib/reviewerAuth";
import { parseTopicMarkdown } from "@/lib/sources";

const FIX = path.join(process.cwd(), "tests", "fixtures");
const decision = fs.readFileSync(path.join(FIX, "decision-soto-excerpt.txt"), "utf8");
const draft = fs.readFileSync(path.join(FIX, "draft-soto.md"), "utf8");
const meta = extractDecisionMeta(decision);
const errorsOf = (md: string) => checkDraft(md, decision, meta).filter((i) => i.level === "error");

describe("decision links", () => {
  it("accepts LawPhil and SC E-Library over https", () => {
    expect(checkDecisionUrl("https://lawphil.net/judjuris/juri2026/apr2026/gr_249759_2026.html").ok).toBe(true);
    expect(checkDecisionUrl("https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/1/12345").ok).toBe(true);
  });
  it.each([
    "http://lawphil.net/x.html",
    "https://example.com/gr.html",
    "https://lawphil.net.evil.com/x",
    "https://lawphil.net:8443/x",
    "https://user:pw@lawphil.net/x",
    "https://169.254.169.254/latest/meta-data",
    "https://localhost/x",
    "not a url",
  ])("rejects %s", (url) => {
    expect(checkDecisionUrl(url).ok).toBe(false);
  });
});

describe("reading a decision", () => {
  it("decodes LawPhil's windows-1252 text (ñ)", () => {
    const bytes = new Uint8Array([0x44, 0x69, 0xf1, 0x6f]); // "Diño" in windows-1252
    expect(decodeHtmlBytes(bytes, "text/html")).toBe("Diño");
  });
  it("strips tags and decodes entities", () => {
    expect(htmlToText("<p>Di&ntilde;o&nbsp;v. Di&#241;o</p><!-- note --><script>x</script>")).toBe("Diño v. Diño");
  });
  it("reads the G.R. number, date, division, ponente and parties", () => {
    expect(meta.grNumber).toBe("G.R. No. 249759");
    expect(meta.date).toBe("April 22, 2026");
    expect(meta.dateISO).toBe("2026-04-22");
    expect(meta.division).toBe("FIRST DIVISION");
    expect(meta.ponente).toBe("ROSARIO");
    expect(meta.parties).toMatch(/^JUANITO B\. SOTO, PETITIONER, vs\. CASSANDRA REYES-SOTO/);
    expect(meta.kind).toBe("decision");
  });
  it("spots a separate opinion", () => {
    const text = "G.R. No. 258524, April 8, 2026\nCONCURRING OPINION\nLEONEN, J.:\nI concur.";
    expect(extractDecisionMeta(text).kind).toBe("separate-opinion");
  });
  it("parses dates", () => {
    expect(toISODate("June 30, 2026")).toBe("2026-06-30");
    expect(toISODate("Sept. 5, 2025")).toBe("2025-09-05");
    expect(toISODate("soon")).toBeNull();
  });
});

describe("Bar cut-off", () => {
  it("a decision on or before the cut-off counts for this Bar", () => {
    expect(cutoffStatus("2026-04-22")).toMatchObject({ barYear: 2027, inCurrentBar: true });
    expect(cutoffStatus("2026-06-30").inCurrentBar).toBe(true);
  });
  it("a later decision is kept for the next Bar", () => {
    expect(cutoffStatus("2026-07-01")).toMatchObject({ barYear: 2028, inCurrentBar: false });
  });
  it("an unreadable date is flagged", () => {
    expect(cutoffStatus(null).barYear).toBeNull();
  });
});

describe("Bar-exam paragraph model answers", () => {
  it("reads (Answer) (Legal basis) (Application) (Conclusion) paragraphs", () => {
    const topic = parseTopicMarkdown(draft, "x", { includeDrafts: true })!;
    expect(topic.modelAnswer.answer).toMatch(/^The petition should be granted/);
    expect(topic.modelAnswer.legalBasis).toMatch(/^Art\. 36, Family Code\./);
    expect(topic.modelAnswer.application).toMatch(/^Friends who knew Marco/);
    expect(topic.modelAnswer.conclusion).toMatch(/^Declare the marriage void ab initio/);
    expect(topic.modelAnswer.application).not.toContain("(Conclusion)");
  });
  it("still reads the older bullet form", () => {
    const old = draft.replace(
      /Model answer:\n\(Answer\)[\s\S]*?(?=\n# )/,
      "Model answer:\n- Answer: A.\n- Legal basis: B.\n- Application: C.\n- Conclusion: D.\n",
    );
    const topic = parseTopicMarkdown(old, "x", { includeDrafts: true })!;
    expect(topic.modelAnswer).toEqual({ answer: "A.", legalBasis: "B.", application: "C.", conclusion: "D." });
  });
});

describe("draft checks", () => {
  it("the Soto draft passes every check", () => {
    expect(checkDraft(draft, decision, meta)).toEqual([]);
  });
  it("catches a quote that is not word for word", () => {
    const bad = draft.replace("personally interview both spouses", "personally interview each spouse");
    expect(errorsOf(bad).some((i) => i.message.startsWith("This quote is not word for word"))).toBe(true);
  });
  it("catches a case named without its G.R. number and date", () => {
    const bad = draft.replace("Diño v. Diño, G.R. No. 178044, January 19, 2011; ", "Diño v. Diño; ");
    expect(errorsOf(bad).some((i) => i.message.includes("Diño v. Diño"))).toBe(true);
  });
  it("finds cases missing a citation", () => {
    expect(casesMissingCitation("As held in Tan-Andal v. Andal, the rule is clear.")).toEqual(["Tan-Andal v. Andal"]);
    expect(casesMissingCitation("Tan-Andal v. Andal, G.R. No. 196359, May 11, 2021")).toEqual([]);
  });
  it("a draft must stay status: draft with empty sign-off fields", () => {
    expect(errorsOf(draft.replace("status: draft", "status: demo")).length).toBeGreaterThan(0);
    expect(errorsOf(draft.replace('reviewedBy: ""', 'reviewedBy: "Atty. X"')).length).toBeGreaterThan(0);
  });
  it("year levels must follow the year plan", () => {
    expect(yearLevelsFor("Persons and Family Relations")).toEqual(["year-1", "year-4", "bar"]);
    expect(yearLevelsFor("Succession")).toEqual(["year-2", "year-3", "year-4", "bar"]);
    expect(errorsOf(draft.replace("yearLevels: [year-1, year-4, bar]", "yearLevels: [bar]")).length).toBeGreaterThan(0);
  });
  it("a subject outside this app is rejected", () => {
    expect(errorsOf(draft.replace("subject: Persons and Family Relations", "subject: Taxation")).length).toBeGreaterThan(0);
  });
  it("the citation must carry the decision's G.R. number and date", () => {
    const bad = draft.replace(/^citation:.*$/m, 'citation: "Family Code, Article 36"');
    expect(errorsOf(bad).filter((i) => i.message.startsWith("citation must")).length).toBe(2);
  });
  it("Year 1 drafts need the quiz", () => {
    const noQuiz = draft.split("# Objective and multiple-choice quiz")[0];
    expect(errorsOf(noQuiz).some((i) => i.message.includes("quiz items"))).toBe(true);
  });
  it("a model answer missing a paragraph is rejected", () => {
    const bad = draft.replace(/\n\(Conclusion\)[^\n]*\n/, "\n");
    expect(errorsOf(bad).some((i) => i.message.includes("(Conclusion)"))).toBe(true);
  });
  it("warns when the problem copies the decision's facts", () => {
    const copied = draft.replace(
      "Marco and Tess married in 2010",
      "Soto and Reyes-Soto met and became friends in 1979 while they were college students at the University of the Philippines, Quezon City. Marco and Tess married in 2010",
    );
    expect(checkDraft(copied, decision, meta).some((i) => i.level === "warning" && i.message.includes("words in a row"))).toBe(true);
    expect(longestSharedRun("totally new facts here", decision)).toBe(0);
  });
});

describe("header the app fills in", () => {
  it("forces draft status, year levels and empty sign-off, and drops a code fence", () => {
    const raw =
      '```markdown\n---\ntopicId: x\nsubject: Succession\nyearLevels: [bar]\nstatus: demo\nreviewedBy: "Someone"\nlastReviewed: "2026-01-01"\n---\n# Source text\nx\n```';
    const md = enforceDraftHeader(raw, yearLevelsFor("Succession"));
    expect(md.startsWith("---\n")).toBe(true);
    expect(md).toContain("yearLevels: [year-2, year-3, year-4, bar]");
    expect(md).toContain("status: draft");
    expect(md).toContain('reviewedBy: ""');
    expect(md).toContain('lastReviewed: ""');
    expect(md).not.toContain("```");
  });
});

describe("reviewer passcode", () => {
  const saved = process.env.REVIEWER_CODE;
  afterEach(() => {
    if (saved === undefined) delete process.env.REVIEWER_CODE;
    else process.env.REVIEWER_CODE = saved;
  });
  it("is switched off when no passcode is set", () => {
    delete process.env.REVIEWER_CODE;
    expect(checkReviewerCode("anything")).toBe("not-set-up");
  });
  it("is switched off when the passcode is too short", () => {
    process.env.REVIEWER_CODE = "short";
    expect(checkReviewerCode("short")).toBe("not-set-up");
  });
  it("accepts only the right passcode", () => {
    process.env.REVIEWER_CODE = "correct-horse-battery";
    expect(checkReviewerCode("correct-horse-battery")).toBe("ok");
    expect(checkReviewerCode("wrong")).toBe("wrong-code");
    expect(checkReviewerCode(undefined)).toBe("wrong-code");
  });
});
