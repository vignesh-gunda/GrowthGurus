import { NextResponse } from "next/server";
import { getProvider } from "@/lib/orchestration/config";
import { buildPipelineContext } from "@/lib/orchestration/context";
import { runPhase3 } from "@/lib/orchestration/run-phase-3";
import type { RunPhase3Request, RunPhase3Response } from "@/lib/orchestration/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RunPhase3Request;
    const context = buildPipelineContext(body.onboarding, body.selectedZoneId);
    const phase3 = await runPhase3(context, body.strategyControls);

    const response: RunPhase3Response = {
      provider: getProvider(),
      mode: phase3.mode,
      phase3: phase3.result,
      trace: [`Provider selected: ${getProvider()}`, `Selected zone: ${context.selectedZone.label}`, `Phase 3 complete (${phase3.mode}).`]
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to run Phase 3."
      },
      { status: 500 }
    );
  }
}
