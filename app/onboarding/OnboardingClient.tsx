"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getUsageNotice } from "@/lib/access";
import {
  loadState,
  markUsageNoticeSeen,
  setUserGroup,
} from "@/lib/storage";
import type { UserGroup } from "@/lib/types";

const GROUPS: { id: UserGroup; label: string; blurb: string }[] = [
  {
    id: "year-1-2",
    label: "Year 1–2 student",
    blurb: "Practice after class for future recitations and exams.",
  },
  {
    id: "year-3-4",
    label: "Year 3–4 student",
    blurb: "Quick Check in class; drills outside class for exams.",
  },
  {
    id: "bar-first-time",
    label: "Bar reviewee (first-time)",
    blurb: "Practice anytime. Optional diagnostic available.",
  },
  {
    id: "bar-repeater",
    label: "Bar reviewee (repeater)",
    blurb: "Practice anytime. A short diagnostic finds weak spots first.",
  },
];

export function OnboardingClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [group, setGroup] = useState<UserGroup | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [step, setStep] = useState<"choose" | "notice">("choose");

  useEffect(() => {
    const state = loadState();
    if (
      state.userGroup &&
      (searchParams.get("notice") === "1" || !state.usageNoticeSeen)
    ) {
      setGroup(state.userGroup);
      setNotice(getUsageNotice(state.userGroup));
      setStep("notice");
    } else if (state.userGroup && state.usageNoticeSeen) {
      router.replace("/");
    }
  }, [router, searchParams]);

  function chooseGroup(id: UserGroup) {
    setUserGroup(id);
    setGroup(id);
    setNotice(getUsageNotice(id));
    setStep("notice");
  }

  function continueAfterNotice() {
    markUsageNoticeSeen();
    router.replace("/");
  }

  if (step === "notice" && notice && group) {
    return (
      <section className="space-y-6">
        <h1 className="font-display text-3xl text-ink">Before you start</h1>
        <p className="rounded-lg border border-line bg-white/70 p-4 text-base leading-relaxed">
          {notice}
        </p>
        <p className="text-sm text-muted">
          Never use this during exams, quizzes, proctored mock bars, or the bar
          exam itself. School and review-center rules come first.
        </p>
        <button
          type="button"
          onClick={continueAfterNotice}
          className="w-full rounded-md bg-accent px-4 py-3 text-base font-medium text-white sm:w-auto"
        >
          I understand — continue
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Who are you practicing as?</h1>
        <p className="mt-2 text-muted">
          Your group controls which features you see and when. You can change
          this later in Settings.
        </p>
      </div>
      <ul className="space-y-3">
        {GROUPS.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => chooseGroup(item.id)}
              className="w-full rounded-lg border border-line bg-white/80 px-4 py-4 text-left transition hover:border-accent hover:bg-accent-soft/40"
            >
              <span className="block font-medium text-ink">{item.label}</span>
              <span className="mt-1 block text-sm text-muted">{item.blurb}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
