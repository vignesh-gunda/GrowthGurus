import { NextResponse } from "next/server";
import { refreshSanFranciscoInstagramCampaign } from "@/lib/apify-instagram";
import { defaultCampaignInput } from "@/lib/mock-campaign";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      onboarding?: typeof defaultCampaignInput;
    };

    const onboarding = body.onboarding ?? defaultCampaignInput;
    const result = await refreshSanFranciscoInstagramCampaign(onboarding);

    return NextResponse.json({
      mode: "live",
      source: "apify",
      records: result.records,
      campaign: result.campaign
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to refresh Instagram data from Apify."
      },
      { status: 500 }
    );
  }
}
