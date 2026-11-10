import { SHARED_SOCRATIC_RULES } from "./shared";
import type { AlacElement } from "../types";

export function buildProblemScoreSystemPrompt(args: {
  topicTitle: string;
  citation: string;
  link: string;
  sourceText: string;
  keyPoints: string[];
  problem: string;
  modelAnswer: {
    answer: string;
    legalBasis: string;
    application: string;
    conclusion: string;
  };
  reviewedBy: string;
  lastReviewed: string;
}): string {
  return `${SHARED_SOCRATIC_RULES}

Feature: Problem drill scoring (ALAC).
Score four elements, each 0–2, BEFORE showing any model answer:
- Answer: a direct conclusion
- Legal basis: the correct provision or doctrine
- Application: the facts tied to the law
- Conclusion

Identify the lowest-scoring element for coaching. Do NOT reveal the full model answer yet.

Problem:
${args.problem}

Reviewed source:
Title: ${args.topicTitle}
Citation: ${args.citation}
Link: ${args.link}
Reviewed by: ${args.reviewedBy} on ${args.lastReviewed}

Source text:
${args.sourceText}

Key points:
${args.keyPoints.map((p) => `- ${p}`).join("\n")}

Model answer (for your scoring only — do not show yet):
- Answer: ${args.modelAnswer.answer}
- Legal basis: ${args.modelAnswer.legalBasis}
- Application: ${args.modelAnswer.application}
- Conclusion: ${args.modelAnswer.conclusion}

JSON schema:
{
  "verdict": "correct" | "partly correct" | "not yet",
  "feedback": "1-3 sentences on the answer structure with citation; Practice score language only",
  "rubric": { "Answer": 0|1|2, "Legal basis": 0|1|2, "Application": 0|1|2, "Conclusion": 0|1|2 },
  "weakElement": "Answer" | "Legal basis" | "Application" | "Conclusion",
  "oneThingToFix": "one concrete improvement on the weakest element",
  "nextQuestion": "Socratic follow-up about the weakest element only",
  "sources": [{ "title": string, "citation": string, "link": string, "reviewedBy": string, "lastReviewed": string }],
  "declined": boolean
}`;
}

export function buildProblemCoachingSystemPrompt(args: {
  topicTitle: string;
  citation: string;
  link: string;
  sourceText: string;
  keyPoints: string[];
  problem: string;
  weakElement: AlacElement;
  modelSlice: string;
  reviewedBy: string;
  lastReviewed: string;
  mode: "coach" | "rescore";
}): string {
  return `${SHARED_SOCRATIC_RULES}

Feature: Problem drill ${args.mode === "coach" ? "coaching" : "retry re-score"} on weakest element only: ${args.weakElement}.
Problem:
${args.problem}

Reviewed source for ${args.topicTitle} (${args.citation}, ${args.link}; reviewed by ${args.reviewedBy} on ${args.lastReviewed}):
${args.sourceText}

Key points:
${args.keyPoints.map((p) => `- ${p}`).join("\n")}

Model slice for ${args.weakElement} (reveal only on rescore after the student retries, or after 2 unsuccessful coaching attempts):
${args.modelSlice}

${
  args.mode === "coach"
    ? "Ask a Socratic follow-up about the weak element only. Do not show the full model answer."
    : "Re-score only the weak element 0–2. Then you may show the model answer for that element and the full model answer summary."
}

JSON schema:
{
  "verdict": "correct" | "partly correct" | "not yet",
  "feedback": "string with citation; use Practice score wording",
  "nextQuestion": "string",
  "elementScore": 0 | 1 | 2,
  "showModelAnswer": boolean,
  "modelAnswer": string | null,
  "oneThingToFix": string | null,
  "sources": [{ "title": string, "citation": string, "link": string, "reviewedBy": string, "lastReviewed": string }],
  "declined": boolean
}`;
}
