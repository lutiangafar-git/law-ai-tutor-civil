/**
 * Bar reviewee diagnostic (spec §3.1, criteria 62–68).
 * 20 past Bar questions picked at random from this subject's bank (sources/_diagnostic.md),
 * spread across the subject's areas. The student answers each in a few lines (issue and rule);
 * the fast model grades each answer only against that item's checked model answer and key points.
 * The result is a map of areas to improve, which points the student to their first drills.
 * Required for repeaters before regular drills; optional for first-time takers.
 */

export const DIAGNOSTIC_SIZE = 20;
export const DIAGNOSTIC_ANSWER_LIMIT = 1200;
export const DIAGNOSTIC_FILE = "_diagnostic.md";

export interface DiagnosticItem {
  id: string;
  area: string;
  syllabusRef: string;
  syllabusYear: number;
  /** Where the question comes from, e.g. "2015 Bar Examination, Civil Law, Question XVIII". */
  askedIn: string;
  question: string;
  /** Short model answer written for this app (never copied from a reviewer). */
  answer: string;
  keyPoints: string[];
  citation: string;
}

/** What the browser may see before answering. */
export interface ClientDiagnosticItem {
  id: string;
  area: string;
  askedIn: string;
  question: string;
}

export type DiagnosticVerdict = "correct" | "partly correct" | "not yet";

export interface DiagnosticResult {
  itemId: string;
  area: string;
  verdict: DiagnosticVerdict;
}

/** Parses the bank: items start with "## <id>" and have "field: value" lines. */
export function parseDiagnosticBank(markdown: string): DiagnosticItem[] {
  const blocks = markdown.split(/\n(?=## )/).filter((b) => b.startsWith("## "));
  return blocks.map((block) => {
    const lines = block.split("\n");
    const id = lines[0].replace(/^##\s*/, "").trim();
    const field = (name: string) => {
      const re = new RegExp(`^${name}:\\s*(.*)$`, "im");
      return block.match(re)?.[1]?.trim() ?? "";
    };
    return {
      id,
      area: field("area"),
      syllabusRef: field("syllabusRef"),
      syllabusYear: Number(field("syllabusYear") || 0),
      askedIn: field("askedIn"),
      question: field("question"),
      answer: field("answer"),
      keyPoints: field("keyPoints")
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean),
      citation: field("citation"),
    };
  });
}

export function toClientDiagnosticItem(item: DiagnosticItem): ClientDiagnosticItem {
  return { id: item.id, area: item.area, askedIn: item.askedIn, question: item.question };
}

function shuffle<T>(list: T[], random: () => number): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Picks `size` different items at random, spread across areas: areas take turns
 * (in random order) until enough items are chosen.
 */
export function pickDiagnostic(
  bank: DiagnosticItem[],
  size: number = DIAGNOSTIC_SIZE,
  random: () => number = Math.random,
): DiagnosticItem[] {
  const byArea = new Map<string, DiagnosticItem[]>();
  for (const item of shuffle(bank, random)) {
    byArea.set(item.area, [...(byArea.get(item.area) ?? []), item]);
  }
  const queues = shuffle([...byArea.values()], random);
  const picked: DiagnosticItem[] = [];
  while (picked.length < Math.min(size, bank.length)) {
    for (const q of queues) {
      const next = q.shift();
      if (next) picked.push(next);
      if (picked.length >= size) break;
    }
  }
  return picked;
}

export const VERDICT_POINTS: Record<DiagnosticVerdict, number> = {
  correct: 2,
  "partly correct": 1,
  "not yet": 0,
};

export type AreaLevel = "Strong" | "Fair" | "Needs work";

export interface AreaSummary {
  area: string;
  answered: number;
  percent: number;
  level: AreaLevel;
}

/** Per-area result, weakest first. 75%+ Strong, 40–74% Fair, below 40% Needs work. */
export function summarizeDiagnostic(results: DiagnosticResult[]): AreaSummary[] {
  const areas = new Map<string, { points: number; n: number }>();
  for (const r of results) {
    const a = areas.get(r.area) ?? { points: 0, n: 0 };
    a.points += VERDICT_POINTS[r.verdict];
    a.n += 1;
    areas.set(r.area, a);
  }
  return [...areas.entries()]
    .map(([area, { points, n }]) => {
      const percent = Math.round((points / (2 * n)) * 100);
      const level: AreaLevel = percent >= 75 ? "Strong" : percent >= 40 ? "Fair" : "Needs work";
      return { area, answered: n, percent, level };
    })
    .sort((a, b) => a.percent - b.percent || a.area.localeCompare(b.area));
}

export function normalizeVerdict(value: unknown): DiagnosticVerdict {
  const v = String(value ?? "").toLowerCase();
  if (v === "correct") return "correct";
  if (v.startsWith("partly")) return "partly correct";
  return "not yet";
}

export function buildDiagnosticGradePrompt(item: DiagnosticItem): string {
  return `You grade ONE short answer in a Philippine Bar review diagnostic. Be fair, brief and encouraging.
Use ONLY the reviewed model answer, key points and citation below. Never invent case names, G.R. numbers,
article numbers or quotes. The student may write in English, Filipino or Taglish.

Grade:
- "correct": reaches the model answer's conclusion AND states the governing rule (wording may differ).
- "partly correct": right conclusion with a wrong or missing rule, or the right rule with a wrong conclusion.
- "not yet": wrong conclusion and wrong or missing rule, off-topic, or empty of legal content.

Question (${item.askedIn}):
${item.question}

Reviewed model answer:
${item.answer}

Key points:
${item.keyPoints.map((p) => `- ${p}`).join("\n")}

Citation: ${item.citation}

Return ONLY JSON: {"verdict": "correct" | "partly correct" | "not yet", "feedback": "one or two sentences: what was right and what to improve, citing ${item.citation}"}`;
}
