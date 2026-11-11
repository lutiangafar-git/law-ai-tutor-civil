"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GroupGuard } from "@/components/GroupGuard";
import {
  DIAGNOSTIC_ANSWER_LIMIT,
  summarizeDiagnostic,
  type ClientDiagnosticItem,
  type DiagnosticVerdict,
} from "@/lib/diagnostic";
import { categoryOf, groupForUrl } from "@/lib/profiles";
import { loadState, markDiagnosticCompleted, updateState } from "@/lib/storage";
import { SUBJECT } from "@/lib/subject";
import type { StoredUserState } from "@/lib/types";

type Run = NonNullable<StoredUserState["diagnosticRun"]>;
type Feedback = { verdict: DiagnosticVerdict; feedback: string; modelAnswer: string; citation: string };

const VERDICT_STYLE: Record<DiagnosticVerdict, string> = {
  correct: "border-emerald-300 bg-emerald-50 text-emerald-900",
  "partly correct": "border-amber-300 bg-amber-50 text-amber-900",
  "not yet": "border-rose-300 bg-rose-50 text-rose-900",
};

/** 20 random Bar questions; one at a time; ends with a map of areas to improve. Bar reviewees only. */
function DiagnosticInner() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [run, setRun] = useState<Run | null>(null);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<Feedback | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const state = loadState();
    const ok = categoryOf(state.userGroup) === "bar";
    setAllowed(ok);
    if (!ok) return;
    if (state.diagnosticRun && state.diagnosticRun.items.length > 0) {
      setRun(state.diagnosticRun);
      return;
    }
    fetch(`/api/diagnostic?group=${groupForUrl(state.userGroup)}`)
      .then((r) => r.json())
      .then((data: { items?: ClientDiagnosticItem[] }) => {
        if (!data.items?.length) {
          setMessage("The diagnostic isn't available yet. Try again later.");
          return;
        }
        const fresh: Run = { items: data.items, results: [], startedAt: new Date().toISOString() };
        updateState({ diagnosticRun: fresh, diagnosticOffered: true });
        setRun(fresh);
      })
      .catch(() => setMessage("The diagnostic is unavailable right now. Try again in a minute."));
  }, []);

  if (allowed === false) {
    return (
      <p className="rounded-md border border-line bg-white/70 p-4 text-sm text-muted">
        The diagnostic is for bar reviewees.{" "}
        <Link className="text-accent underline" href="/drills">
          Back to drills
        </Link>
      </p>
    );
  }
  if (!run) return <p className="text-muted">{message || "Picking your 20 questions…"}</p>;

  const answeredIds = new Set(run.results.map((r) => r.itemId));
  const current = run.items.find((i) => !answeredIds.has(i.id));
  const total = run.items.length;
  const done = run.results.length;

  async function submit() {
    if (!current || busy) return;
    const text = answer.trim();
    if (!text) {
      setMessage("Type your answer first. A rough one is fine.");
      return;
    }
    if (text.length > DIAGNOSTIC_ANSWER_LIMIT) {
      setMessage(`Keep it short: ${DIAGNOSTIC_ANSWER_LIMIT} characters or fewer.`);
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group: groupForUrl(loadState().userGroup), itemId: current.id, answer: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message ?? "The tutor is unavailable right now. Your answer is saved, so try again in a minute.");
        return;
      }
      setResult(data as Feedback);
    } catch {
      setMessage("The tutor is unavailable right now. Your answer is saved, so try again in a minute.");
    } finally {
      setBusy(false);
    }
  }

  function next() {
    if (!current || !result || !run) return;
    const updated: Run = {
      ...run,
      results: [...run.results, { itemId: current.id, area: current.area, verdict: result.verdict }],
    };
    if (updated.results.length >= updated.items.length) {
      updated.finishedAt = new Date().toISOString();
      markDiagnosticCompleted();
    }
    updateState({ diagnosticRun: updated });
    setRun(updated);
    setAnswer("");
    setResult(null);
  }

  function retake() {
    updateState({ diagnosticRun: null });
    window.location.reload();
  }

  if (!current) {
    const summary = summarizeDiagnostic(run.results);
    const levelStyle = { "Needs work": "text-rose-800", Fair: "text-amber-800", Strong: "text-emerald-800" } as const;
    return (
      <section className="space-y-5">
        <h1 className="font-display text-3xl">Your areas to improve</h1>
        <p className="text-sm text-muted">
          Practice result from {total} {SUBJECT.subjectName} questions. Not an official grade or a prediction of
          bar results. Start your drills with the areas at the top.
        </p>
        <ul className="space-y-2">
          {summary.map((a) => (
            <li key={a.area} className="rounded-lg border border-line bg-white/80 px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium">{a.area}</span>
                <span className={`text-sm font-medium ${levelStyle[a.level]}`}>
                  {a.level} · {a.percent}%
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-line" aria-hidden="true">
                <div className="h-2 rounded-full bg-accent" style={{ width: `${a.percent}%` }} />
              </div>
              <span className="mt-1 block text-xs text-muted">{a.answered} question{a.answered === 1 ? "" : "s"}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-3">
          <Link href="/bar" className="rounded-md bg-accent px-4 py-2 text-white">
            Go to my drills
          </Link>
          <button type="button" onClick={retake} className="rounded-md border border-line px-4 py-2">
            Retake with 20 new questions
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm text-muted">
          Diagnostic · Question {done + 1} of {total} · {current.area}
        </p>
        <div className="mt-2 h-2 rounded-full bg-line" aria-hidden="true">
          <div className="h-2 rounded-full bg-accent" style={{ width: `${Math.round((done / total) * 100)}%` }} />
        </div>
      </div>
      <div className="rounded-lg border border-sky-200 bg-sky-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-800">Question</p>
        <p className="mt-1 text-base leading-relaxed text-ink">{current.question}</p>
        <p className="mt-2 text-xs text-sky-900">{current.askedIn}</p>
      </div>

      {!result ? (
        <div className="space-y-2">
          <label htmlFor="diag-answer" className="block text-sm text-muted">
            Your answer in a few lines: your conclusion and the rule that decides it.
          </label>
          <textarea
            id="diag-answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={5}
            maxLength={DIAGNOSTIC_ANSWER_LIMIT}
            className="w-full rounded-md border border-line bg-white px-3 py-2"
          />
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="rounded-md bg-accent px-4 py-2 text-white disabled:opacity-60"
          >
            {busy ? "Checking…" : "Submit answer"}
          </button>
        </div>
      ) : (
        <div className={`space-y-3 rounded-lg border p-4 ${VERDICT_STYLE[result.verdict]}`} role="status">
          <p className="text-xs font-semibold uppercase tracking-wide">{result.verdict}</p>
          {result.feedback && <p className="text-sm">{result.feedback}</p>}
          <div className="rounded-md bg-white/70 p-3 text-sm text-ink">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Model answer</p>
            <p className="mt-1">{result.modelAnswer}</p>
            <p className="mt-1 text-xs text-muted">{result.citation}</p>
          </div>
          <button type="button" onClick={next} className="rounded-md bg-accent px-4 py-2 text-white">
            {done + 1 >= total ? "See my areas to improve" : "Next question"}
          </button>
        </div>
      )}
      {message && (
        <p role="status" className="text-sm text-muted">
          {message}
        </p>
      )}
    </section>
  );
}

export default function DiagnosticPage() {
  return (
    <GroupGuard>
      <DiagnosticInner />
    </GroupGuard>
  );
}
