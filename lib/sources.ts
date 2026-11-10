import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { SourceTopic, UserGroup, YearLevelTag } from "./types";

const SOURCES_DIR = path.join(process.cwd(), "sources");

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") return [value];
  return [];
}

function extractSection(body: string, heading: string): string {
  const pattern = new RegExp(
    `#\\s*${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\n([\\s\\S]*?)(?=\\n#\\s|$)`,
    "i",
  );
  const match = body.match(pattern);
  return match?.[1]?.trim() ?? "";
}

function extractBullets(section: string): string[] {
  return section
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim())
    .filter(Boolean);
}

function fieldAfterLabel(section: string, label: string): string {
  const re = new RegExp(
    `${label}:\\s*([\\s\\S]*?)(?=\\n(?:Scenario|Model answer|Problem|Answer|Legal basis|Application|Conclusion):|$)`,
    "i",
  );
  const match = section.match(re);
  return match?.[1]?.trim() ?? "";
}

function parseModelAnswerBlock(section: string): SourceTopic["modelAnswer"] {
  const pick = (label: string) => {
    const re = new RegExp(
      `-\\s*${label}:\\s*([\\s\\S]*?)(?=\\n-\\s*(?:Answer|Legal basis|Application|Conclusion):|$)`,
      "i",
    );
    return section.match(re)?.[1]?.trim() ?? "";
  };
  return {
    answer: pick("Answer"),
    legalBasis: pick("Legal basis"),
    application: pick("Application"),
    conclusion: pick("Conclusion"),
  };
}

function isReviewed(data: Record<string, unknown>): boolean {
  const reviewedBy = String(data.reviewedBy ?? "").trim();
  const lastReviewed = String(data.lastReviewed ?? "").trim();
  return Boolean(reviewedBy && lastReviewed);
}

function parseTopicFile(filePath: string): SourceTopic | null {
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);

  if (!isReviewed(data)) return null;

  const yearLevels = asStringArray(data.yearLevels) as YearLevelTag[];
  const keyPointsSection =
    extractSection(content, "Key points for the tutor (reviewer-approved)") ||
    extractSection(content, "Key points for the tutor");
  const recitationSection = extractSection(
    content,
    "Recitation drill: application fact pattern",
  );
  const problemSection = extractSection(
    content,
    "Problem drill: exam or bar-style problem",
  );

  return {
    topicId: String(data.topicId ?? path.basename(filePath, ".md")),
    title: String(data.title ?? ""),
    subject: String(data.subject ?? ""),
    yearLevels,
    syllabusWeek:
      data.syllabusWeek !== undefined ? Number(data.syllabusWeek) : undefined,
    citation: String(data.citation ?? ""),
    link: String(data.link ?? ""),
    reviewedBy: String(data.reviewedBy ?? ""),
    lastReviewed: String(data.lastReviewed ?? ""),
    sourceText: extractSection(content, "Source text"),
    keyPoints: extractBullets(keyPointsSection),
    recitationScenario: fieldAfterLabel(recitationSection, "Scenario"),
    recitationModelAnswer: fieldAfterLabel(recitationSection, "Model answer"),
    problem: fieldAfterLabel(problemSection, "Problem"),
    modelAnswer: parseModelAnswerBlock(problemSection),
    rawMarkdown: content,
  };
}

export function loadAllReviewedTopics(): SourceTopic[] {
  if (!fs.existsSync(SOURCES_DIR)) return [];

  return fs
    .readdirSync(SOURCES_DIR)
    .filter((name) => name.endsWith(".md") && !name.startsWith("_"))
    .map((name) => parseTopicFile(path.join(SOURCES_DIR, name)))
    .filter((topic): topic is SourceTopic => topic !== null)
    .sort((a, b) => a.title.localeCompare(b.title));
}

function groupToYearTags(group: UserGroup): YearLevelTag[] {
  if (group === "year-1-2") return ["year-1-2"];
  if (group === "year-3-4") return ["year-3-4"];
  return ["bar"];
}

export function getTopicsForGroup(group: UserGroup): SourceTopic[] {
  const tags = groupToYearTags(group);
  return loadAllReviewedTopics().filter((topic) =>
    topic.yearLevels.some((y) => tags.includes(y)),
  );
}

export function getTopicById(
  topicId: string,
  group?: UserGroup,
): SourceTopic | null {
  const topics = group ? getTopicsForGroup(group) : loadAllReviewedTopics();
  return topics.find((t) => t.topicId === topicId) ?? null;
}

/** Safe payload for the client: no model answers until the drill reveals them. */
export function toClientTopicSummary(topic: SourceTopic) {
  return {
    topicId: topic.topicId,
    title: topic.title,
    subject: topic.subject,
    citation: topic.citation,
    link: topic.link,
    reviewedBy: topic.reviewedBy,
    lastReviewed: topic.lastReviewed,
    yearLevels: topic.yearLevels,
  };
}
