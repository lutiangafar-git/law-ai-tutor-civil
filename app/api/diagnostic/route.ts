import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import {
  DIAGNOSTIC_ANSWER_LIMIT,
  DIAGNOSTIC_FILE,
  buildDiagnosticGradePrompt,
  normalizeVerdict,
  parseDiagnosticBank,
  pickDiagnostic,
  toClientDiagnosticItem,
  type DiagnosticItem,
} from "@/lib/diagnostic";
import { logTutorEvent } from "@/lib/monitoring";

export const runtime = "nodejs";

const FAST_MODEL = "claude-haiku-5-5";
const UNAVAILABLE =
  "The tutor is unavailable right now. Your answer is saved, so try again in a minute.";

function loadBank(): DiagnosticItem[] {
  const file = path.join(process.cwd(), "sources", DIAGNOSTIC_FILE);
  if (!fs.existsSync(file)) return [];
  return parseDiagnosticBank(fs.readFileSync(file, "utf8"));
}

/** Only bar reviewees take the diagnostic. Browsers send "bar" so repeater status never travels. */
function isBar(group: unknown): boolean {
  return group === "bar" || group === "bar-first-time" || group === "bar-repeater";
}

/** GET ?group=bar → 20 random questions (no answers). */
export async function GET(request: Request) {
  const group = new URL(request.url).searchParams.get("group");
  if (!isBar(group)) {
    return NextResponse.json({ error: "not_allowed" }, { status: 403 });
  }
  const items = pickDiagnostic(loadBank()).map(toClientDiagnosticItem);
  return NextResponse.json({ items });
}

interface Body {
  group?: string;
  itemId?: string;
  answer?: string;
}

/** POST {group, itemId, answer} → verdict, feedback, and the model answer to learn from. */
export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!isBar(body.group)) {
    return NextResponse.json({ error: "not_allowed" }, { status: 403 });
  }
  const item = loadBank().find((i) => i.id === body.itemId);
  if (!item) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const answer = String(body.answer ?? "").trim();
  if (!answer) {
    return NextResponse.json({ error: "empty", message: "Type your answer first. A rough one is fine." }, { status: 400 });
  }
  if (answer.length > DIAGNOSTIC_ANSWER_LIMIT) {
    return NextResponse.json(
      { error: "too_long", message: `Keep it short: ${DIAGNOSTIC_ANSWER_LIMIT} characters or fewer.` },
      { status: 400 },
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "unavailable", message: UNAVAILABLE }, { status: 503 });

  try {
    const client = new Anthropic({ apiKey });
    const started = Date.now();
    const message = await client.messages.create(
      {
        model: FAST_MODEL,
        max_tokens: 600,
        system: buildDiagnosticGradePrompt(item),
        messages: [{ role: "user", content: `Student's answer:\n${answer}` }],
      },
      { timeout: 30_000 },
    );
    logTutorEvent({ event: "tutor_call", feature: "diagnostic", model: FAST_MODEL, ms: Date.now() - started, outcome: message.stop_reason ?? "unknown" });
    const text = message.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
    const json = (() => {
      try {
        return JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? "{}") as Record<string, unknown>;
      } catch {
        return {};
      }
    })();
    return NextResponse.json({
      verdict: normalizeVerdict(json.verdict),
      feedback: String(json.feedback ?? ""),
      modelAnswer: item.answer,
      citation: item.citation,
    });
  } catch {
    logTutorEvent({ event: "tutor_error", feature: "diagnostic" });
    return NextResponse.json({ error: "unavailable", message: UNAVAILABLE }, { status: 503 });
  }
}
