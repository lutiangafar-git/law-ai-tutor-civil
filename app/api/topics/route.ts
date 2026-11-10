import { NextResponse } from "next/server";
import { getTopicById, getTopicsForGroup, toClientTopicSummary } from "@/lib/sources";
import type { UserGroup } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const group = searchParams.get("group") as UserGroup | null;
  const topicId = searchParams.get("topicId");
  const includeProblem = searchParams.get("includeProblem") === "1";
  const includeScenario = searchParams.get("includeScenario") === "1";

  if (!group) {
    return NextResponse.json({ topics: [] });
  }

  if (topicId) {
    const topic = getTopicById(topicId, group);
    if (!topic) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({
      topic: {
        ...toClientTopicSummary(topic),
        ...(includeProblem ? { problem: topic.problem } : {}),
        ...(includeScenario
          ? { recitationScenario: topic.recitationScenario }
          : {}),
      },
    });
  }

  const topics = getTopicsForGroup(group).map(toClientTopicSummary);
  return NextResponse.json({ topics });
}
