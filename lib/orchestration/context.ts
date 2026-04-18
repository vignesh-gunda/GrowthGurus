import { generateMockCampaign } from "@/lib/mock-campaign";
import type { CampaignOnboardingInput } from "@/lib/mock-campaign";
import type { PipelineContext } from "@/lib/orchestration/types";

export function buildPipelineContext(
  onboarding: CampaignOnboardingInput,
  selectedZoneId?: string
): PipelineContext {
  const campaign = generateMockCampaign(onboarding);
  const selectedZone =
    campaign.zoneSummaries.find((zone) => zone.zoneId === selectedZoneId) ??
    campaign.zoneSummaries[0];

  if (!selectedZone) {
    throw new Error("No zone available for orchestration.");
  }

  return {
    onboarding,
    campaign,
    selectedZone
  };
}
