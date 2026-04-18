import type { CampaignOnboardingInput, GeneratedCampaign, ZoneSummary } from "@/lib/mock-campaign";

export type OrchestrationProvider = "openai" | "kalibr" | "mock";
export type RunMode = "live" | "mock-fallback";

export type Phase2Allocation = {
  zoneId: string;
  label: string;
  reachScore: number;
  productFitScore: number;
  budgetAllocated: number;
  priorityTier: number;
  rationale: string;
};

export type Phase2Result = {
  allocations: Phase2Allocation[];
  totalAllocated: number;
  zonesFunded: number;
  rebalanceIterations: number;
  summary: string;
};

export type Phase3Controls = {
  tone: string;
  angle: string;
  audienceFocus: string;
};

export type Phase3Result = {
  zoneId: string;
  identityArchetype: string;
  currentSelf: string;
  aspirationalSelf: string;
  primaryTension: string;
  productBridge: string;
  primaryHook: string;
  hookVariants: string[];
  campaignTone: string;
  visualDirection: string;
  explanation: string;
};

export type Phase4Controls = {
  sloganStyle: string;
  visualStyle: string;
  selectedDuration: "15s" | "30s" | "60s";
};

export type Phase4Result = {
  zoneId: string;
  primarySlogan: string;
  sloganVariants: string[];
  visualBrief: {
    styleDirection: string;
    mood: string;
    colorPalette: string[];
    imagePrompt: string;
  };
  scripts: {
    "15s": string;
    "30s": string;
    "60s": string;
  };
};

export type RunCampaignRequest = {
  onboarding: CampaignOnboardingInput;
  selectedZoneId?: string;
  strategyControls: Phase3Controls;
  creativeControls: Phase4Controls;
  runFull?: boolean;
};

export type RunCampaignResponse = {
  provider: OrchestrationProvider;
  mode: RunMode;
  phase2: Phase2Result;
  phase3: Phase3Result;
  phase4: Phase4Result;
  trace: string[];
};

export type RunPhase3Request = {
  onboarding: CampaignOnboardingInput;
  selectedZoneId?: string;
  strategyControls: Phase3Controls;
};

export type RunPhase3Response = {
  provider: OrchestrationProvider;
  mode: RunMode;
  phase3: Phase3Result;
  trace: string[];
};

export type RunPhase4Request = {
  onboarding: CampaignOnboardingInput;
  selectedZoneId?: string;
  strategy: Phase3Result;
  creativeControls: Phase4Controls;
};

export type RunPhase4Response = {
  provider: OrchestrationProvider;
  mode: RunMode;
  phase4: Phase4Result;
  trace: string[];
};

export type PipelineContext = {
  onboarding: CampaignOnboardingInput;
  campaign: GeneratedCampaign;
  selectedZone: ZoneSummary;
};
