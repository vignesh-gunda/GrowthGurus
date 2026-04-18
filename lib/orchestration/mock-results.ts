import type {
  Phase2Result,
  Phase3Controls,
  Phase3Result,
  Phase4Controls,
  Phase4Result,
  PipelineContext
} from "@/lib/orchestration/types";

export function buildMockPhase2(context: PipelineContext): Phase2Result {
  const allocations = context.campaign.zoneSummaries
    .map((zone, index) => {
      const reachScore = Math.min(95, 55 + zone.avgEngagement / 2);
      const productFitScore = Math.min(92, 62 + (zone.postCountDaily % 25));
      const budgetAllocated = Math.round(
        (context.onboarding.totalBudget / context.campaign.zoneSummaries.length) * (1.06 - index * 0.08)
      );

      return {
        zoneId: zone.zoneId,
        label: zone.label,
        reachScore,
        productFitScore,
        budgetAllocated,
        priorityTier: index + 1,
        rationale: `${zone.label} combines ${zone.postCountDaily} daily signal volume with strong ${zone.dominantPlatform} activity.`
      };
    })
    .sort((left, right) => right.reachScore + right.productFitScore - (left.reachScore + left.productFitScore));

  return {
    allocations,
    totalAllocated: allocations.reduce((sum, item) => sum + item.budgetAllocated, 0),
    zonesFunded: allocations.length,
    rebalanceIterations: 1,
    summary: `${allocations[0]?.label} is the lead zone for launch, with the rest funded to maintain coverage across the region.`
  };
}

export function buildMockPhase3(
  context: PipelineContext,
  controls: Phase3Controls
): Phase3Result {
  const zone = context.selectedZone;

  return {
    zoneId: zone.zoneId,
    identityArchetype: `${controls.audienceFocus} striver with ${zone.dominantPlatform}-native habits`,
    currentSelf: `Always moving through ${zone.label}, juggling social presence, work momentum, and energy dips.`,
    aspirationalSelf: `Wants to feel in control, visibly sharp, and ahead of the pace in ${zone.label}.`,
    primaryTension: `Right when the day in ${zone.label} shifts from functional to social, they need to stay switched on without feeling forced.`,
    productBridge: `${context.onboarding.productName} becomes the fast ritual they reach for when pace and visibility both spike.`,
    primaryHook: `${controls.tone} energy for the moment ${zone.label} starts expecting more from you.`,
    hookVariants: [
      `When ${zone.label} speeds up, stay sharper than the room.`,
      `${context.onboarding.productName} for the handoff between grind and glow.`,
      `Hold your edge when ${zone.label} starts watching.`
    ],
    campaignTone: controls.tone,
    visualDirection: `${controls.angle} framing with ${controls.audienceFocus} styling cues and movement-heavy urban scenes.`,
    explanation: `This direction is shaped by ${zone.postCountDaily} daily signals, ${zone.avgEngagement} average engagement, and ${zone.dominantPlatform} being the dominant platform in the zone.`
  };
}

export function buildMockPhase4(
  context: PipelineContext,
  controls: Phase4Controls
): Phase4Result {
  const zone = context.selectedZone;

  return {
    zoneId: zone.zoneId,
    primarySlogan: `Stay sharp in ${zone.label}.`,
    sloganVariants: [
      `Keep pace. Keep presence.`,
      `More edge. Less crash.`,
      `Built for the shift after five.`
    ],
    visualBrief: {
      styleDirection: controls.visualStyle,
      mood: `${controls.sloganStyle}, urban, fast, polished`,
      colorPalette: ["#172033", "#de6f37", "#f7f4ed", "#9bd3d0"],
      imagePrompt: `Editorial city-night campaign in ${zone.label}, dynamic crowd motion, premium product energy, ${controls.visualStyle} look, bold contrast, OOH-ready composition.`
    },
    scripts: {
      "15s": `Open on a compressed city rush in ${zone.label}. Show the tension. Reveal ${context.onboarding.productName}. End on the selected slogan.`,
      "30s": `Start with pace and pressure in ${zone.label}. Show the identity moment. Shift with ${context.onboarding.productName}. Resolve with confidence and a direct CTA.`,
      "60s": `Build the full emotional arc through work, social momentum, and visibility in ${zone.label}. Let the product enter as the unlock and end in the aspirational state.`
    }
  };
}
