import { NextResponse } from "next/server";
import { getProvider } from "@/lib/orchestration/config";
import { buildPipelineContext } from "@/lib/orchestration/context";
import { runPhase4 } from "@/lib/orchestration/run-phase-4";
import type { RunPhase4Request, RunPhase4Response } from "@/lib/orchestration/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RunPhase4Request;
    const context = buildPipelineContext(body.onboarding, body.selectedZoneId);
    const phase4 = await runPhase4(context, body.strategy, body.creativeControls);

    const response: RunPhase4Response = {
      provider: getProvider(),
      mode: phase4.mode,
      phase4: phase4.result,
      trace: [`Provider selected: ${getProvider()}`, `Selected zone: ${context.selectedZone.label}`, `Phase 4 complete (${phase4.mode}).`]
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to run Phase 4."
      },
      { status: 500 }
    );
  }
}
