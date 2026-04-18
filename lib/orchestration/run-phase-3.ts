import { getProvider } from "@/lib/orchestration/config";
import { runKalibrJson } from "@/lib/orchestration/kalibr";
import { buildMockPhase3 } from "@/lib/orchestration/mock-results";
import { runOpenAIJson } from "@/lib/orchestration/openai";
import type { Phase3Controls, Phase3Result, PipelineContext, RunMode } from "@/lib/orchestration/types";

const systemPrompt = `You are Phase 3 of a geo-targeted marketing engine.
Return JSON only with this shape:
{
  "zoneId": "string",
  "identityArchetype": "string",
  "currentSelf": "string",
  "aspirationalSelf": "string",
  "primaryTension": "string",
  "productBridge": "string",
  "primaryHook": "string",
  "hookVariants": ["string"],
  "campaignTone": "string",
  "visualDirection": "string",
  "explanation": "string"
}`;

export async function runPhase3(
  context: PipelineContext,
  controls: Phase3Controls
): Promise<{
  result: Phase3Result;
  mode: RunMode;
}> {
  const provider = getProvider();
  const input = {
    onboarding: context.onboarding,
    selectedZone: context.selectedZone,
    controls
  };

  try {
    if (provider === "openai") {
      return {
        result: await runOpenAIJson<Phase3Result>({ phase: "phase3", system: systemPrompt, input }),
        mode: "live"
      };
    }

    if (provider === "kalibr") {
      return {
        result: await runKalibrJson<Phase3Result>({ system: systemPrompt, input }),
        mode: "live"
      };
    }
  } catch {
    return { result: buildMockPhase3(context, controls), mode: "mock-fallback" };
  }

  return { result: buildMockPhase3(context, controls), mode: "mock-fallback" };
}
