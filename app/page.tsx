"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ClassPauseBanner } from "@/components/ClassPauseBanner";
import { DemoBanner } from "@/components/DemoBanner";
import { FeatureCard } from "@/components/FeatureCard";
import { GroupGuard } from "@/components/GroupGuard";
import {
  getHomeFeatureOrder,
  isPausedForClass,
} from "@/lib/access";
import {
  loadState,
  markDiagnosticOffered,
  markDiagnosticCompleted,
} from "@/lib/storage";
import { yearQuery } from "@/lib/profiles";
import type { Feature, UserGroup } from "@/lib/types";

type TopicSummary = {
  topicId: string;
  title: string;
  subject: string;
  lastReviewed: string;
  isDemo?: boolean;
};

function HomeInner() {
  const [group, setGroup] = useState<UserGroup | null>(null);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [paused, setPaused] = useState(false);
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [resumeHref, setResumeHref] = useState<string | null>(null);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [diagnosticTopics, setDiagnosticTopics] = useState<TopicSummary[]>([]);

  useEffect(() => {
    const state = loadState();
    if (!state.userGroup) return;

    const now = new Date();
    setGroup(state.userGroup);
    setPaused(isPausedForClass(state.userGroup, state.classSchedule, now));
    setFeatures(
      getHomeFeatureOrder(state.userGroup, state.classSchedule, now),
    );

    if (state.activeDrill) {
      const map: Record<Feature, string> = {
        "recitation-drill": `/recitation/${state.activeDrill.topicId}`,
        "in-class-quick-check": `/quick-check/${state.activeDrill.topicId}`,
        "problem-drill": `/problem/${state.activeDrill.topicId}`,
      };
      setResumeHref(map[state.activeDrill.feature]);
    }

    fetch(`/api/topics?group=${state.userGroup}${yearQuery(state.studentYear)}`)
      .then((r) => r.json())
      .then((data: { topics: TopicSummary[] }) => {
        setTopics(data.topics ?? []);
        if (data.topics?.[0]) setSelectedTopic(data.topics[0].topicId);

        const isRepeater = state.userGroup === "bar-repeater";
        const isFirstTime = state.userGroup === "bar-first-time";
        if (
          (isRepeater && !state.diagnosticOffered) ||
          (isFirstTime && !state.diagnosticOffered && !state.diagnosticCompleted)
        ) {
          // Diagnostic: one problem from each of up to three different subjects.
          const seen = new Set<string>();
          const pick = (data.topics ?? [])
            .filter((t) => (seen.has(t.subject) ? false : (seen.add(t.subject), true)))
            .slice(0, 3);
          setDiagnosticTopics(pick);
          setShowDiagnostic(isRepeater || isFirstTime);
        }
      })
      .catch(() => setTopics([]));
  }, []);

  const selectedIsDemo = topics.find((t) => t.topicId === selectedTopic)?.isDemo ?? false;

  const subjects = useMemo(() => {
    return Array.from(new Set(topics.map((t) => t.subject)));
  }, [topics]);

  function startDiagnostic() {
    const ids = diagnosticTopics.map((t) => t.topicId);
    markDiagnosticOffered(ids);
    setShowDiagnostic(false);
    if (ids[0]) {
      window.location.href = `/problem/${ids[0]}?diagnostic=1`;
    }
  }

  function skipDiagnostic() {
    markDiagnosticOffered([]);
    if (group === "bar-first-time") markDiagnosticCompleted();
    setShowDiagnostic(false);
  }

  return (
    <section className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-ink sm:text-4xl">Practice</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Socratic drills grounded in reviewed Philippine sources. Only features
          allowed for your group right now are shown.
        </p>
      </div>

      {resumeHref && (
        <Link
          href={resumeHref}
          className="block rounded-lg border border-accent bg-accent-soft/40 px-4 py-3 font-medium text-accent"
        >
          Continue where you left off
        </Link>
      )}

      {paused ? (
        <ClassPauseBanner />
      ) : (
        <>
          {showDiagnostic && (
            <div className="rounded-lg border border-line bg-white/80 p-4">
              <h2 className="font-display text-xl">
                {group === "bar-repeater"
                  ? "Repeater diagnostic"
                  : "Optional diagnostic"}
              </h2>
              <p className="mt-2 text-sm text-muted">
                Three short problem drills across the subject to find weak spots
                before regular practice.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={startDiagnostic}
                  className="rounded-md bg-accent px-4 py-2 text-white"
                  disabled={diagnosticTopics.length === 0}
                >
                  Start diagnostic
                </button>
                {group === "bar-first-time" && (
                  <button
                    type="button"
                    onClick={skipDiagnostic}
                    className="rounded-md border border-line px-4 py-2"
                  >
                    Skip for now
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h2 className="font-display text-xl">Choose a topic</h2>
            {topics.length === 0 ? (
              <p className="rounded-md border border-line bg-white/70 p-4 text-sm text-muted">
                No topics are available for your year yet. Topics appear once a
                law-trained reviewer signs off their source file.
              </p>
            ) : (
              <>
                <p className="text-sm text-muted">
                  {subjects.length === 1 ? "Subject" : "Subjects"}: {subjects.join(" · ")}
                </p>
                <select
                  className="w-full rounded-md border border-line bg-white px-3 py-3"
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                >
                  {subjects.map((subject) => (
                    <optgroup key={subject} label={subject}>
                      {topics
                        .filter((topic) => topic.subject === subject)
                        .map((topic) => (
                          <option key={topic.topicId} value={topic.topicId}>
                            {topic.title}
                            {topic.isDemo ? " (demo)" : ""}
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>
                {selectedIsDemo && <DemoBanner />}
              </>
            )}
          </div>

          {selectedTopic && features.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-display text-xl">Start a drill</h2>
              <div className="grid gap-3">
                {features.map((feature, index) => (
                  <FeatureCard
                    key={feature}
                    feature={feature}
                    topicId={selectedTopic}
                    lead={index === 0}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default function HomePage() {
  return (
    <GroupGuard>
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <HomeInner />
      </Suspense>
    </GroupGuard>
  );
}
