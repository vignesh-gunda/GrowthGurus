import { getProvider } from "@/lib/orchestration/config";
import { runKalibrJson } from "@/lib/orchestration/kalibr";
import { buildMockPhase2 } from "@/lib/orchestration/mock-results";
import { runOpenAIJson } from "@/lib/orchestration/openai";
import type { Phase2Result, PipelineContext, RunMode } from "@/lib/orchestration/types";

const systemPrompt = `You are Phase 2 of a geo-targeted marketing engine.
Return JSON only with this shape:
{
  "allocations": [
    {
      "zoneId": "string",
      "label": "string",
      "reachScore": number,
      "productFitScore": number,
      "budgetAllocated": number,
      "priorityTier": number,
      "rationale": "string"
    }
  ],
  "totalAllocated": number,
  "zonesFunded": number,
  "rebalanceIterations": number,
  "summary": "string"
}`;

export async function runPhase2(context: PipelineContext): Promise<{
  result: Phase2Result;
  mode: RunMode;
}> {
  const provider = getProvider();
  const input = {
    onboarding: context.onboarding,
    zones: context.campaign.zoneSummaries,
    placements: context.campaign.placements
  };

  try {
    if (provider === "openai") {
      return {
        result: await runOpenAIJson<Phase2Result>({ phase: "phase2", system: systemPrompt, input }),
        mode: "live"
      };
    }

    if (provider === "kalibr") {
      return {
        result: await runKalibrJson<Phase2Result>({ system: systemPrompt, input }),
        mode: "live"
      };
    }
  } catch {
    return { result: buildMockPhase2(context), mode: "mock-fallback" };
  }

  return { result: buildMockPhase2(context), mode: "mock-fallback" };
}
