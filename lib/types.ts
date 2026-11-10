export type UserGroup =
  | "year-1-2"
  | "year-3-4"
  | "bar-first-time"
  | "bar-repeater";

export type Feature =
  | "recitation-drill"
  | "in-class-quick-check"
  | "problem-drill";

export type YearLevelTag = "year-1-2" | "year-3-4" | "bar";

export type Verdict = "correct" | "partly correct" | "not yet";

export type AlacElement =
  | "Answer"
  | "Legal basis"
  | "Application"
  | "Conclusion";

export interface ClassBlock {
  /** 0 = Sunday … 6 = Saturday */
  dayOfWeek: number;
  startMinutes: number;
  endMinutes: number;
  label?: string;
}

export interface ClassSchedule {
  blocks: ClassBlock[];
}

export interface SourceMeta {
  topicId: string;
  title: string;
  subject: string;
  yearLevels: YearLevelTag[];
  syllabusWeek?: number;
  citation: string;
  link: string;
  reviewedBy: string;
  lastReviewed: string;
}

export interface SourceTopic extends SourceMeta {
  sourceText: string;
  keyPoints: string[];
  recitationScenario: string;
  recitationModelAnswer: string;
  problem: string;
  modelAnswer: {
    answer: string;
    legalBasis: string;
    application: string;
    conclusion: string;
  };
  rawMarkdown: string;
}

export interface TutorSourceRef {
  title: string;
  citation: string;
  link: string;
  reviewedBy: string;
  lastReviewed: string;
}

export interface AlacScores {
  Answer: number;
  "Legal basis": number;
  Application: number;
  Conclusion: number;
}

export interface TutorTurnResponse {
  verdict: Verdict;
  feedback: string;
  nextQuestion?: string;
  rubric?: Record<string, number> | AlacScores;
  oneThingToFix?: string;
  sources?: TutorSourceRef[];
  weakElement?: AlacElement;
  modelAnswer?: string;
  declined?: boolean;
}

export interface DrillProgress {
  feature: Feature;
  topicId: string;
  step: number;
  attemptCount: number;
  answers: string[];
  scores: number[];
  alacScores?: AlacScores;
  weakElement?: AlacElement;
  phase?:
    | "answering"
    | "scored"
    | "coaching"
    | "retry"
    | "complete"
    | "quick-check"
    | "quick-check-done";
  exchangeCount?: number;
  updatedAt: string;
}

export interface ProblemScoreRecord {
  topicId: string;
  scores: AlacScores;
  finishedAt: string;
  isDiagnostic?: boolean;
}

export interface StoredUserState {
  userGroup: UserGroup | null;
  classSchedule: ClassSchedule;
  usageNoticeSeen: boolean;
  diagnosticOffered: boolean;
  diagnosticCompleted: boolean;
  diagnosticTopicIds: string[];
  activeDrill: DrillProgress | null;
  problemScores: ProblemScoreRecord[];
  recitationScores: {
    topicId: string;
    stepScores: number[];
    finishedAt: string;
  }[];
  rateLimit: { windowStart: number; count: number };
}
