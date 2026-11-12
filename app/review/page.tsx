"use client";

import { useState } from "react";
import { BAR_EXAM } from "@/lib/barExam";
import { SUBJECT } from "@/lib/subject";

type Issue = { level: "error" | "warning"; message: string };
type Meta = {
  grNumber: string | null;
  date: string | null;
  ponente: string | null;
  division: string | null;
  parties: string | null;
};
type Cutoff = { barYear: number | null; inCurrentBar: boolean; note: string };

/**
 * Reviewer-only page: paste a LawPhil or SC E-Library link, get a draft topic, edit it,
 * then download the .md file. Drafts never reach students until a lawyer signs them off
 * and the file is added to /sources with reviewedBy and lastReviewed filled in.
 */
export default function ReviewPage() {
  const [code, setCode] = useState("");
  const [url, setUrl] = useState("");
  const [areaHint, setAreaHint] = useState("");
  const [busy, setBusy] = useState<"" | "draft" | "check">("");
  const [error, setError] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [decisionText, setDecisionText] = useState("");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [cutoff, setCutoff] = useState<Cutoff | null>(null);
  const [copied, setCopied] = useState(false);

  const errors = issues.filter((i) => i.level === "error");

  async function post(path: string, payload: object) {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error ?? "Something went wrong."), { data });
    return data;
  }

  async function makeDraft() {
    setBusy("draft");
    setError("");
    setIssues([]);
    setMarkdown("");
    setMeta(null);
    setCutoff(null);
    try {
      const data = await post("/api/review/draft", { code, url, areaHint });
      setMarkdown(data.markdown);
      setDecisionText(data.decisionText);
      setIssues(data.issues ?? []);
      setMeta(data.meta);
      setCutoff(data.cutoff);
    } catch (err) {
      const e = err as Error & { data?: { meta?: Meta; cutoff?: Cutoff } };
      setError(e.message);
      if (e.data?.meta) setMeta(e.data.meta);
      if (e.data?.cutoff) setCutoff(e.data.cutoff);
    } finally {
      setBusy("");
    }
  }

  async function recheck() {
    setBusy("check");
    setError("");
    try {
      const data = await post("/api/review/check", { code, markdown, decisionText });
      setIssues(data.issues ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy("");
    }
  }

  function fileName() {
    const id = /^topicId:\s*["']?([\w-]+)/m.exec(markdown)?.[1] ?? "draft-topic";
    return `${id}.md`;
  }

  function download() {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName();
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Copy did not work in this browser. Use Download instead.");
    }
  }

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="font-display text-2xl">Draft a topic from an SC decision</h1>
        <p className="text-muted">
          For lawyer reviewers only. Paste the link to a Supreme Court decision on LawPhil or the SC
          E-Library. The app drafts a {SUBJECT.subjectName} topic (quiz, recitation and a bar-style
          problem) and checks every quote against the decision. Students never see a draft. It goes live
          only after you check the law, fill in <code>reviewedBy</code> and <code>lastReviewed</code>,
          and add the file to the app.
        </p>
        <p className="text-sm text-muted">
          {BAR_EXAM.year} Bar cut-off: decisions promulgated on or before {BAR_EXAM.cutoff}.
        </p>
      </section>

      <section className="space-y-3">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Reviewer passcode</span>
          <input
            type="password"
            autoComplete="off"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full rounded-md border border-line bg-white px-3 py-2"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Link to the decision</span>
          <input
            type="url"
            placeholder="https://lawphil.net/judjuris/juri2026/apr2026/gr_249759_2026.html"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded-md border border-line bg-white px-3 py-2"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Subject area (optional)</span>
          <select
            value={areaHint}
            onChange={(e) => setAreaHint(e.target.value)}
            className="w-full rounded-md border border-line bg-white px-3 py-2"
          >
            <option value="">Let the app decide</option>
            {SUBJECT.areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={makeDraft}
          disabled={!code || !url || busy !== ""}
          className="rounded-md bg-accent px-4 py-2 text-white disabled:opacity-50"
        >
          {busy === "draft" ? "Reading the decision and drafting… (up to a minute)" : "Make draft"}
        </button>
        {error && <p className="text-sm text-warn">{error}</p>}
      </section>

      {meta && (
        <section className="space-y-1 rounded-md border border-line bg-white/70 px-3 py-3 text-sm">
          <p>
            <strong>Decision:</strong> {meta.parties ?? "parties not read"}
          </p>
          <p>
            <strong>{meta.grNumber ?? "G.R. number not read"}</strong>, {meta.date ?? "date not read"}
            {meta.division ? ` · ${meta.division}` : ""}
            {meta.ponente ? ` · ${meta.ponente}, J.` : ""}
          </p>
          {cutoff && <p className={cutoff.inCurrentBar ? "text-muted" : "text-warn"}>{cutoff.note}</p>}
        </section>
      )}

      {markdown && (
        <section className="space-y-3">
          <h2 className="font-display text-xl">Checks</h2>
          {issues.length === 0 ? (
            <p className="text-sm text-accent">
              All checks passed: every quote is word for word in the decision, and every case has its title,
              G.R. number and date. Now check the law itself.
            </p>
          ) : (
            <ul className="space-y-1 text-sm">
              {issues.map((i, n) => (
                <li key={n} className={i.level === "error" ? "text-warn" : "text-muted"}>
                  {i.level === "error" ? "Must fix: " : "Note: "}
                  {i.message}
                </li>
              ))}
            </ul>
          )}

          <h2 className="font-display text-xl">Draft (you can edit it here)</h2>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            rows={28}
            spellCheck
            className="w-full rounded-md border border-line bg-white px-3 py-2 font-mono text-sm"
          />
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={recheck}
              disabled={busy !== ""}
              className="rounded-md border border-accent px-4 py-2 text-sm font-medium text-accent disabled:opacity-50"
            >
              {busy === "check" ? "Checking…" : "Check again after edits"}
            </button>
            <button
              type="button"
              onClick={download}
              disabled={errors.length > 0}
              title={errors.length > 0 ? "Fix the 'Must fix' items first" : ""}
              className="rounded-md bg-accent px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              Download {fileName()}
            </button>
            <button type="button" onClick={copy} className="rounded-md border border-line px-4 py-2 text-sm">
              {copied ? "Copied" : "Copy text"}
            </button>
          </div>
          <p className="text-sm text-muted">
            Reminder: teach doctrines from the main opinion only, and write facts fresh. The decision text
            is public, but our questions and model answers must be our own work.
          </p>
        </section>
      )}
    </div>
  );
}
