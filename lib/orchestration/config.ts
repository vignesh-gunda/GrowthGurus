import type { OrchestrationProvider } from "@/lib/orchestration/types";

export function getProvider(): OrchestrationProvider {
  const configured = process.env.MARKAGENT_LLM_PROVIDER?.toLowerCase();

  if (configured === "openai" || configured === "kalibr" || configured === "mock") {
    return configured;
  }

  if (process.env.OPENAI_API_KEY) {
    return "openai";
  }

  if (process.env.KALIBR_API_KEY && process.env.KALIBR_TENANT_ID) {
    return "kalibr";
  }

  return "mock";
}

export function getModelForPhase(phase: "phase2" | "phase3" | "phase4") {
  const envKey =
    phase === "phase2"
      ? process.env.MARKAGENT_PHASE2_MODEL
      : phase === "phase3"
        ? process.env.MARKAGENT_PHASE3_MODEL
        : process.env.MARKAGENT_PHASE4_MODEL;

  return envKey || "gpt-5.4-mini";
}
