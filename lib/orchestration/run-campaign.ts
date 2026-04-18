import { getProvider } from "@/lib/orchestration/config";
import { buildPipelineContext } from "@/lib/orchestration/context";
import { runPhase2 } from "@/lib/orchestration/run-phase-2";
import { runPhase3 } from "@/lib/orchestration/run-phase-3";
import { runPhase4 } from "@/lib/orchestration/run-phase-4";
import type { RunCampaignRequest, RunCampaignResponse } from "@/lib/orchestration/types";

export async function runCampaign(request: RunCampaignRequest): Promise<RunCampaignResponse> {
  const context = buildPipelineContext(request.onboarding, request.selectedZoneId);
  const selectedZone = context.selectedZone;

  const trace: string[] = [`Provider selected: ${getProvider()}`, `Selected zone: ${selectedZone.label}`];

  const phase2 = await runPhase2(context);
  trace.push(`Phase 2 complete (${phase2.mode}).`);

  const phase3 = await runPhase3(context, request.strategyControls);
  trace.push(`Phase 3 complete (${phase3.mode}).`);

  const phase4 = await runPhase4(context, phase3.result, request.creativeControls);
  trace.push(`Phase 4 complete (${phase4.mode}).`);

  return {
    provider: getProvider(),
    mode:
      phase2.mode === "live" && phase3.mode === "live" && phase4.mode === "live"
        ? "live"
        : "mock-fallback",
    phase2: phase2.result,
    phase3: phase3.result,
    phase4: phase4.result,
    trace
  };
}
