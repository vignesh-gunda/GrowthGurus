import { getProvider } from "@/lib/orchestration/config";
import { runKalibrJson } from "@/lib/orchestration/kalibr";
import { buildMockPhase4 } from "@/lib/orchestration/mock-results";
import { runOpenAIJson } from "@/lib/orchestration/openai";
import type {
  Phase3Result,
  Phase4Controls,
  Phase4Result,
  PipelineContext,
  RunMode
} from "@/lib/orchestration/types";

const systemPrompt = `You are Phase 4 of a geo-targeted marketing engine.
Return JSON only with this shape:
{
  "zoneId": "string",
  "primarySlogan": "string",
  "sloganVariants": ["string"],
  "visualBrief": {
    "styleDirection": "string",
    "mood": "string",
    "colorPalette": ["string"],
    "imagePrompt": "string"
  },
  "scripts": {
    "15s": "string",
    "30s": "string",
    "60s": "string"
  }
}`;

export async function runPhase4(
  context: PipelineContext,
  phase3: Phase3Result,
  controls: Phase4Controls
): Promise<{
  result: Phase4Result;
  mode: RunMode;
}> {
  const provider = getProvider();
  const input = {
    onboarding: context.onboarding,
    selectedZone: context.selectedZone,
    strategy: phase3,
    controls
  };

  try {
    if (provider === "openai") {
      return {
        result: await runOpenAIJson<Phase4Result>({ phase: "phase4", system: systemPrompt, input }),
        mode: "live"
      };
    }

    if (provider === "kalibr") {
      return {
        result: await runKalibrJson<Phase4Result>({ system: systemPrompt, input }),
        mode: "live"
      };
    }
  } catch {
    return { result: buildMockPhase4(context, controls), mode: "mock-fallback" };
  }

  return { result: buildMockPhase4(context, controls), mode: "mock-fallback" };
}
