import { NextResponse } from "next/server";
import { runCampaign } from "@/lib/orchestration/run-campaign";
import type { RunCampaignRequest } from "@/lib/orchestration/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RunCampaignRequest;
    const result = await runCampaign(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to run orchestration."
      },
      { status: 500 }
    );
  }
}
