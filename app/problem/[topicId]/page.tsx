"use client";

import { Suspense, useEffect, useState } from "react";
import { DemoBanner } from "@/components/DemoBanner";
import { yearQuery } from "@/lib/profiles";
import { useParams, useSearchParams } from "next/navigation";
import { AnswerBox } from "@/components/AnswerBox";
import { ClassPauseBanner } from "@/components/ClassPauseBanner";
import { GroupGuard } from "@/components/GroupGuard";
import { canUseFeature, isPausedForClass } from "@/lib/access";
import {
  addProblemScore,
  clearActiveDrill,
  consumeRateLimit,
  loadState,
  lowestAlacElement,
  markDiagnosticCompleted,
  saveActiveDrill,
} from "@/lib/storage";
import { callTutor, validateAnswerLength } from "@/lib/tutorClient";
import type { AlacElement, AlacScores, UserGroup } from "@/lib/types";

const ELEMENTS: AlacElement[] = [
  "Answer",
  "Legal basis",
  "Application",
  "Conclusion",
];

function ProblemInner() {
  const params = useParams<{ topicId: string }>();
  const searchParams = useSearchParams();
  const topicId = params.topicId;
  const isDiagnostic = searchParams.get("diagnostic") === "1";

  const [group, setGroup] = useState<UserGroup | null>(null);
  const [paused, setPaused] = useState(false);
  const [title, setTitle] = useState(topicId);
  const [isDemo, setIsDemo] = useState(false);
  const [problem, setProblem] = useState("");
  const [phase, setPhase] = useState<
    "answering" | "scored" | "coaching" | "retry" | "complete"
  >("answering");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [question, setQuestion] = useState("Loading problem…");
  const [scores, setScores] = useState<AlacScores | null>(null);
  const [weakElement, setWeakElement] = useState<AlacElement | null>(null);
  const [modelAnswer, setModelAnswer] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const state = loadState();
    if (!state.userGroup) return;
    setGroup(state.userGroup);
    const now = new Date();
    setPaused(isPausedForClass(state.userGroup, state.classSchedule, now));
    if (!canUseFeature(state.userGroup, "problem-drill", state.classSchedule, now)) {
      return;
    }

    fetch(
      `/api/topics?group=${state.userGroup}${yearQuery(state.studentYear)}&topicId=${topicId}&includeProblem=1`,
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.topic) {
          setTitle(data.topic.title);
          setIsDemo(Boolean(data.topic.isDemo));
          setProblem(data.topic.problem ?? "");
        }
      });

    const existing =
      state.activeDrill?.feature === "problem-drill" &&
      state.activeDrill.topicId === topicId
        ? state.activeDrill
        : null;

    if (existing) {
      setPhase(existing.phase as typeof phase);
      setAttemptCount(existing.attemptCount);
      setAnswer(existing.answers[0] ?? "");
      setScores(existing.alacScores ?? null);
      setWeakElement(existing.weakElement ?? null);
      setQuestion("Continue where you left off.");
      return;
    }

    void (async () => {
      const result = await callTutor({
        feature: "problem-drill",
        topicId,
        userGroup: state.userGroup!,
        studentAnswer: "",
        action: "start",
      });
      if (result.ok) {
        setQuestion(result.data.nextQuestion || "Write your full ALAC answer.");
        setFeedback(result.data.feedback);
        saveActiveDrill({
          feature: "problem-drill",
          topicId,
          step: 1,
          attemptCount: 0,
          answers: [],
          scores: [],
          phase: "answering",
          updatedAt: new Date().toISOString(),
        });
      } else {
        setFeedback(result.message);
      }
    })();
  }, [topicId]);

  async function submitAnswer() {
    if (!group || busy) return;
    const lengthError = validateAnswerLength("problem-drill", answer);
    if (lengthError) {
      setFeedback(lengthError);
      return;
    }
    if (!consumeRateLimit().allowed) {
      setFeedback("You've reached 30 tutor messages this hour. Try again later.");
      return;
    }

    setBusy(true);
    const result = await callTutor({
      feature: "problem-drill",
      topicId,
      userGroup: group,
      studentAnswer: answer,
      phase: "answering",
      action: "answer",
    });
    setBusy(false);

    if (!result.ok) {
      setFeedback(result.message);
      return;
    }

    const rubric = result.data.rubric as AlacScores;
    const weak =
      (result.data.weakElement as AlacElement) || lowestAlacElement(rubric);
    setScores(rubric);
    setWeakElement(weak);
    setFeedback(result.data.feedback);
    setQuestion(
      result.data.nextQuestion ||
        `Let's strengthen ${weak} only. Try that element again.`,
    );
    setPhase("coaching");
    setAttemptCount(0);
    saveActiveDrill({
      feature: "problem-drill",
      topicId,
      step: 1,
      attemptCount: 0,
      answers: [answer],
      scores: [],
      alacScores: rubric,
      weakElement: weak,
      phase: "coaching",
      updatedAt: new Date().toISOString(),
    });
  }

  async function submitRetry() {
    if (!group || busy || !weakElement || !scores) return;
    const lengthError = validateAnswerLength("problem-drill", answer);
    if (lengthError) {
      setFeedback(lengthError);
      return;
    }
    if (!consumeRateLimit().allowed) {
      setFeedback("You've reached 30 tutor messages this hour. Try again later.");
      return;
    }

    setBusy(true);
    const result = await callTutor({
      feature: "problem-drill",
      topicId,
      userGroup: group,
      studentAnswer: answer,
      phase: "retry",
      action: "retry",
      weakElement,
      alacScores: scores,
      attemptCount,
    });
    setBusy(false);

    if (!result.ok) {
      setFeedback(result.message);
      return;
    }

    const updated = (result.data.rubric as AlacScores) || scores;
    setScores(updated);
    setFeedback(result.data.feedback);
    if (result.data.modelAnswer) setModelAnswer(result.data.modelAnswer);
    setPhase("complete");
    addProblemScore({
      topicId,
      scores: updated,
      finishedAt: new Date().toISOString(),
      isDiagnostic,
    });

    const state = loadState();
    if (
      isDiagnostic &&
      state.problemScores.filter((s) => s.isDiagnostic).length >= 3
    ) {
      markDiagnosticCompleted();
    }

    clearActiveDrill();
  }

  if (paused) return <ClassPauseBanner />;

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm text-muted">
          Problem drill{isDiagnostic ? " · Diagnostic" : ""}
        </p>
        <h1 className="font-display text-2xl sm:text-3xl">{title}</h1>
        {isDemo && <DemoBanner />}
      </div>

      {problem && (
        <div className="rounded-lg border border-line bg-white/80 p-4">
          <p className="text-sm font-medium text-muted">Problem</p>
          <p className="mt-2 whitespace-pre-wrap leading-relaxed">{problem}</p>
        </div>
      )}

      <div className="rounded-lg border border-line bg-white/80 p-4">
        <p className="leading-relaxed">{question}</p>
        {feedback && (
          <p className="mt-3 border-t border-line pt-3 text-sm leading-relaxed text-muted">
            {feedback}
          </p>
        )}
      </div>

      {scores && (
        <div className="rounded-lg border border-line bg-white/70 p-4 text-sm">
          <p className="font-medium">Practice score (ALAC)</p>
          <p className="mt-1 text-xs text-muted">
            Not official bar grading. Not a pass prediction.
          </p>
          <ul className="mt-2 grid grid-cols-2 gap-2">
            {ELEMENTS.map((el) => (
              <li key={el}>
                {el}: {scores[el]}/2
                {weakElement === el ? " · focus" : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      {phase !== "complete" && (
        <>
          <AnswerBox
            value={answer}
            onChange={setAnswer}
            maxLength={4000}
            disabled={busy}
            label={
              phase === "answering"
                ? "Your full ALAC answer"
                : `Retry: ${weakElement ?? "weakest element"} only`
            }
          />
          <button
            type="button"
            onClick={phase === "answering" ? submitAnswer : submitRetry}
            disabled={busy}
            className="w-full rounded-md bg-accent px-4 py-3 text-white sm:w-auto"
          >
            {busy
              ? "Checking…"
              : phase === "answering"
                ? "Submit for Practice score"
                : "Submit retry"}
          </button>
        </>
      )}

      {phase === "complete" && modelAnswer && (
        <div className="rounded-lg border border-line bg-white/80 p-4">
          <p className="font-medium">Model answer (after retry)</p>
          <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed">
            {modelAnswer}
          </pre>
        </div>
      )}
    </section>
  );
}

export default function ProblemPage() {
  return (
    <GroupGuard>
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <ProblemInner />
      </Suspense>
    </GroupGuard>
  );
}
