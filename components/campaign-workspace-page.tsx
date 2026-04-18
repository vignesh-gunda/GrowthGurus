"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HeatmapMap } from "@/components/heatmap-map";
import type {
  Phase3Controls,
  Phase3Result,
  Phase4Controls,
  Phase4Result,
  RunCampaignResponse,
  RunPhase3Response,
  RunPhase4Response
} from "@/lib/orchestration/types";
import {
  defaultCampaignInput,
  generateMockCampaign,
  loadCampaignInput,
  type GeneratedCampaign
} from "@/lib/mock-campaign";

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

export function CampaignWorkspacePage() {
  const [onboarding, setOnboarding] = useState(defaultCampaignInput);
  const [isLoaded, setIsLoaded] = useState(false);
  const [campaign, setCampaign] = useState<GeneratedCampaign>(() => generateMockCampaign(defaultCampaignInput));
  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [activeTab, setActiveTab] = useState<"audience" | "strategy" | "creative">("strategy");
  const [strategyControls, setStrategyControls] = useState<Phase3Controls>({
    tone: "Confident",
    angle: "Tension-first",
    audienceFocus: "Urban professionals"
  });
  const [creativeControls, setCreativeControls] = useState<Phase4Controls>({
    sloganStyle: "OOH punchy",
    visualStyle: "Cinematic editorial",
    selectedDuration: "30s"
  });
  const [pipeline, setPipeline] = useState<RunCampaignResponse | null>(null);
  const [phase3Draft, setPhase3Draft] = useState<Phase3Result | null>(null);
  const [phase4Draft, setPhase4Draft] = useState<Phase4Result | null>(null);
  const [approvedHook, setApprovedHook] = useState("");
  const [approvedSlogan, setApprovedSlogan] = useState("");
  const [approvedVisual, setApprovedVisual] = useState("");
  const [approvedScript, setApprovedScript] = useState("");
  const [isRunningFull, setIsRunningFull] = useState(false);
  const [isRunningPhase3, setIsRunningPhase3] = useState(false);
  const [isRunningPhase4, setIsRunningPhase4] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [phase3Trace, setPhase3Trace] = useState<string[]>([]);
  const [phase4Trace, setPhase4Trace] = useState<string[]>([]);
  const [phase1Status, setPhase1Status] = useState<"bundled" | "live">("bundled");
  const [isRefreshingPhase1, setIsRefreshingPhase1] = useState(false);

  useEffect(() => {
    const loaded = loadCampaignInput() ?? defaultCampaignInput;
    setOnboarding(loaded);
    setCampaign(generateMockCampaign(loaded));
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    setSelectedZoneId((current) => current || campaign.zoneSummaries[0]?.zoneId || "");
  }, [campaign.zoneSummaries]);

  useEffect(() => {
    setCampaign(generateMockCampaign(onboarding));
    setPhase1Status("bundled");
  }, [onboarding]);

  useEffect(() => {
    setPhase3Draft(null);
    setPhase4Draft(null);
    setApprovedHook("");
    setApprovedSlogan("");
    setApprovedVisual("");
    setApprovedScript("");
  }, [selectedZoneId]);

  const selectedZone =
    campaign.zoneSummaries.find((zone) => zone.zoneId === selectedZoneId) ?? campaign.zoneSummaries[0];
  const selectedPlacement =
    campaign.placements.find((placement) => placement.zoneId === selectedZone?.zoneId) ??
    campaign.placements[0];
  const displayedPhase3 = phase3Draft ?? pipeline?.phase3 ?? null;
  const displayedPhase4 = phase4Draft ?? pipeline?.phase4 ?? null;
  const zoneBudget =
    pipeline?.phase2.allocations.find((allocation) => allocation.zoneId === selectedZone?.zoneId)
      ?.budgetAllocated ?? Math.round(onboarding.totalBudget / Math.max(campaign.zoneSummaries.length, 1));
  const reachScore =
    pipeline?.phase2.allocations.find((allocation) => allocation.zoneId === selectedZone?.zoneId)?.reachScore ??
    78 + ((selectedZone?.avgEngagement ?? 0) % 12);
  const productFit =
    pipeline?.phase2.allocations.find((allocation) => allocation.zoneId === selectedZone?.zoneId)?.productFitScore ??
    70 + ((selectedZone?.postCountDaily ?? 0) % 18);
  const scriptForCurrentDuration = displayedPhase4?.scripts[creativeControls.selectedDuration] ?? "";

  if (!isLoaded) {
    return (
      <main className="min-h-screen px-4 py-5 md:px-8 md:py-8">
        <div className="mx-auto flex min-h-[80vh] max-w-7xl items-center justify-center">
          <div className="surface-panel surface-panel-dark rounded-[30px] px-8 py-7 text-center text-white">
            <div className="eyebrow text-white/45">Loading</div>
            <div className="mt-3 text-2xl font-semibold tracking-[-0.03em]">Preparing workspace</div>
          </div>
        </div>
      </main>
    );
  }

  async function runFullPipeline() {
    setIsRunningFull(true);
    setRunError(null);

    try {
      const response = await fetch("/api/orchestration/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onboarding,
          selectedZoneId: selectedZone?.zoneId,
          strategyControls,
          creativeControls,
          runFull: true
        })
      });

      const payload = (await response.json()) as RunCampaignResponse | { error?: string };

      if (!response.ok) {
        throw new Error("error" in payload ? payload.error || "Failed to run campaign orchestration." : "Failed to run campaign orchestration.");
      }

      const next = payload as RunCampaignResponse;
      setPipeline(next);
      setPhase3Draft(next.phase3);
      setPhase4Draft(next.phase4);
      setPhase3Trace(next.trace);
      setPhase4Trace(next.trace);
      setApprovedHook(next.phase3.primaryHook);
      setApprovedSlogan(next.phase4.primarySlogan);
      setApprovedVisual(next.phase4.visualBrief.styleDirection);
      setApprovedScript(next.phase4.scripts[creativeControls.selectedDuration]);
      setActiveTab("strategy");
    } catch (error) {
      setRunError(error instanceof Error ? error.message : "Failed to run orchestration.");
    } finally {
      setIsRunningFull(false);
    }
  }

  async function refreshPhase1FromApify() {
    setIsRefreshingPhase1(true);
    setRunError(null);

    try {
      const response = await fetch("/api/phase-1/instagram-refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboarding })
      });

      const payload = (await response.json()) as
        | { campaign: GeneratedCampaign; mode: "live"; source: string }
        | { error?: string };

      if (!response.ok || !("campaign" in payload)) {
        throw new Error("error" in payload ? payload.error || "Failed to refresh Instagram data." : "Failed to refresh Instagram data.");
      }

      setCampaign(payload.campaign);
      setPhase1Status("live");
      setSelectedZoneId(payload.campaign.zoneSummaries[0]?.zoneId ?? "");
    } catch (error) {
      setRunError(error instanceof Error ? error.message : "Failed to refresh Instagram data.");
    } finally {
      setIsRefreshingPhase1(false);
    }
  }

  async function regeneratePhase3() {
    setIsRunningPhase3(true);
    setRunError(null);

    try {
      const response = await fetch("/api/orchestration/phase-3/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onboarding,
          selectedZoneId: selectedZone?.zoneId,
          strategyControls
        })
      });

      const payload = (await response.json()) as RunPhase3Response | { error?: string };

      if (!response.ok) {
        throw new Error("error" in payload ? payload.error || "Failed to run Phase 3." : "Failed to run Phase 3.");
      }

      const next = payload as RunPhase3Response;
      setPhase3Draft(next.phase3);
      setPhase3Trace(next.trace);
      setApprovedHook("");
      setActiveTab("strategy");
    } catch (error) {
      setRunError(error instanceof Error ? error.message : "Failed to run Phase 3.");
    } finally {
      setIsRunningPhase3(false);
    }
  }

  async function regeneratePhase4() {
    if (!displayedPhase3) {
      setRunError("Generate strategy first before regenerating creative.");
      return;
    }

    setIsRunningPhase4(true);
    setRunError(null);

    try {
      const response = await fetch("/api/orchestration/phase-4/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onboarding,
          selectedZoneId: selectedZone?.zoneId,
          strategy: displayedPhase3,
          creativeControls
        })
      });

      const payload = (await response.json()) as RunPhase4Response | { error?: string };

      if (!response.ok) {
        throw new Error("error" in payload ? payload.error || "Failed to run Phase 4." : "Failed to run Phase 4.");
      }

      const next = payload as RunPhase4Response;
      setPhase4Draft(next.phase4);
      setPhase4Trace(next.trace);
      setApprovedSlogan("");
      setApprovedVisual("");
      setApprovedScript("");
      setActiveTab("creative");
    } catch (error) {
      setRunError(error instanceof Error ? error.message : "Failed to run Phase 4.");
    } finally {
      setIsRunningPhase4(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-5 md:px-8 md:py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <section className="surface-panel flex flex-col gap-5 p-5 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="eyebrow">Workspace</div>
              <h1 className="mt-3 text-4xl font-bold tracking-[-0.05em] md:text-6xl">
                Campaign operator console
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--ink-soft)] md:text-base">
                A single workspace for map intelligence, zone decisions, editable strategy, and editable creative.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="soft-chip">{onboarding.targetRegion}</div>
              <div className="soft-chip">{formatter.format(onboarding.totalBudget)} budget</div>
              <div className="soft-chip">{pipeline ? `${pipeline.provider} • ${pipeline.mode}` : "awaiting run"}</div>
              <div className="soft-chip">{phase1Status === "live" ? "phase 1 live" : "phase 1 bundled"}</div>
              <Link href="/" className="ghost-link">
                Edit onboarding
              </Link>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            <TopMetric label="Target product" value={onboarding.productName} />
            <TopMetric label="Active zones" value={String(campaign.zoneSummaries.length)} />
            <TopMetric label="Map points" value={String(campaign.geojson.features.length)} />
            <TopMetric label="Sources" value={String(onboarding.platforms.length)} />
          </div>
        </section>

        <section className="flex flex-col gap-5">
          <div className="surface-panel overflow-hidden p-0">
            <div className="flex flex-col gap-4 border-b border-[var(--panel-border)] px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="eyebrow">Geo + Social Layer</div>
                <h2 className="mt-2 text-3xl font-bold tracking-[-0.04em]">Live heatmap workspace</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {onboarding.targetRegion === "San Francisco" ? (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={refreshPhase1FromApify}
                    disabled={isRefreshingPhase1}
                  >
                    {isRefreshingPhase1 ? "Refreshing..." : "Refresh from Apify"}
                  </button>
                ) : null}
                {onboarding.platforms.map((platform) => (
                  <span key={platform} className="soft-chip">
                    {platform.replace("_", " ")}
                  </span>
                ))}
              </div>
            </div>
            <div className="h-[680px]">
              <HeatmapMap data={campaign.geojson} placements={campaign.placements} initialView={campaign.initialView} />
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="grid gap-4 lg:grid-cols-[1.5fr_0.9fr]">
              <div className="surface-panel p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="eyebrow">Phase 1</div>
                    <h3 className="mt-1 text-2xl font-bold tracking-[-0.03em]">Zone shortlist</h3>
                  </div>
                  <div className="soft-chip">{onboarding.targetRegion} live zones</div>
                </div>
                <div className="mt-4 grid gap-3">
                  {campaign.zoneSummaries.map((zone) => (
                    <button
                      key={zone.zoneId}
                      type="button"
                      className={`zone-row ${zone.zoneId === selectedZone?.zoneId ? "zone-row-active" : ""}`}
                      onClick={() => setSelectedZoneId(zone.zoneId)}
                    >
                      <div>
                        <div className="text-base font-semibold">{zone.label}</div>
                        <div className="mt-1 text-sm text-[var(--ink-soft)]">
                          {zone.postCountDaily} daily posts • {zone.dominantPlatform} dominant
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm uppercase tracking-[0.18em] text-[var(--ink-soft)]">Avg engagement</div>
                        <div className="mt-1 text-lg font-semibold">{zone.avgEngagement}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="surface-panel p-5">
                <div className="eyebrow">Phase 2</div>
                <h3 className="mt-1 text-2xl font-bold tracking-[-0.03em]">Selected zone snapshot</h3>
                <div className="mt-4 grid gap-3">
                  <MiniStat label="Reach score" value={String(reachScore)} />
                  <MiniStat label="Product fit" value={`${productFit}%`} />
                  <MiniStat label="Budget" value={formatter.format(zoneBudget)} />
                  <MiniStat label="Placement" value={selectedPlacement?.placementType ?? "Digital screen"} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-5">
            <div className="surface-panel p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="eyebrow">Agent Controls</div>
                  <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">Run, tweak, approve</h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                    The user controls the pipeline by choosing a zone, adjusting guidance, regenerating sections, and approving the outputs worth keeping.
                  </p>
                </div>
                <button type="button" className="primary-button" onClick={runFullPipeline} disabled={isRunningFull}>
                  {isRunningFull ? "Running..." : "Run full pipeline"}
                </button>
              </div>

              {runError ? <div className="error-banner mt-4">{runError}</div> : null}

              <div className="mt-5 flex gap-2">
                <TabButton active={activeTab === "audience"} onClick={() => setActiveTab("audience")}>
                  Audience
                </TabButton>
                <TabButton active={activeTab === "strategy"} onClick={() => setActiveTab("strategy")}>
                  Strategy
                </TabButton>
                <TabButton active={activeTab === "creative"} onClick={() => setActiveTab("creative")}>
                  Creative
                </TabButton>
              </div>

              {activeTab === "audience" && (
                <div className="mt-5 grid gap-4">
                  <InsightCard
                    title="Identity archetype"
                    body={displayedPhase3?.identityArchetype ?? "Run the pipeline to generate a zone-specific audience identity."}
                  />
                  <InsightCard
                    title="Audience brief"
                    body={
                      pipeline?.phase2.summary ??
                      `${selectedZone?.label} trends toward mid-to-high engagement clusters with strong after-work and lifestyle overlap.`
                    }
                  />
                </div>
              )}

              {activeTab === "strategy" && (
                <div className="mt-5 grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <ControlField label="Tone">
                      <select
                        className="field-input"
                        value={strategyControls.tone}
                        onChange={(event) => setStrategyControls((current) => ({ ...current, tone: event.target.value }))}
                      >
                        <option>Confident</option>
                        <option>Premium</option>
                        <option>Playful</option>
                        <option>Urgent</option>
                      </select>
                    </ControlField>
                    <ControlField label="Strategy angle">
                      <select
                        className="field-input"
                        value={strategyControls.angle}
                        onChange={(event) => setStrategyControls((current) => ({ ...current, angle: event.target.value }))}
                      >
                        <option>Tension-first</option>
                        <option>Aspiration-first</option>
                        <option>Identity-first</option>
                      </select>
                    </ControlField>
                    <ControlField label="Audience focus">
                      <input
                        className="field-input"
                        value={strategyControls.audienceFocus}
                        onChange={(event) =>
                          setStrategyControls((current) => ({ ...current, audienceFocus: event.target.value }))
                        }
                      />
                    </ControlField>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button type="button" className="secondary-button" onClick={regeneratePhase3} disabled={isRunningPhase3}>
                      {isRunningPhase3 ? "Regenerating..." : "Regenerate hooks"}
                    </button>
                    {approvedHook ? <span className="approval-pill">Approved hook saved</span> : null}
                  </div>

                  <EditableCard
                    title="Primary tension"
                    value={displayedPhase3?.primaryTension ?? ""}
                    placeholder="Generate Phase 3 to fill this tension."
                    onChange={(value) =>
                      setPhase3Draft((current) => (current ? { ...current, primaryTension: value } : current))
                    }
                  />
                  <EditableCard
                    title="Product bridge"
                    value={displayedPhase3?.productBridge ?? ""}
                    placeholder="Generate Phase 3 to fill this product bridge."
                    onChange={(value) =>
                      setPhase3Draft((current) => (current ? { ...current, productBridge: value } : current))
                    }
                  />

                  <div className="grid gap-3">
                    {[displayedPhase3?.primaryHook, ...(displayedPhase3?.hookVariants ?? [])]
                      .filter((hook): hook is string => Boolean(hook))
                      .map((hook) => (
                        <ApproveCard
                          key={hook}
                          title="Hook option"
                          body={hook}
                          approved={approvedHook === hook}
                          approveLabel="Approve hook"
                          onApprove={() => setApprovedHook(hook)}
                        />
                      ))}
                  </div>

                  {phase3Trace.length > 0 ? <TracePanel title="Phase 3 trace" lines={phase3Trace} /> : null}
                </div>
              )}

              {activeTab === "creative" && (
                <div className="mt-5 grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <ControlField label="Slogan style">
                      <select
                        className="field-input"
                        value={creativeControls.sloganStyle}
                        onChange={(event) =>
                          setCreativeControls((current) => ({ ...current, sloganStyle: event.target.value }))
                        }
                      >
                        <option>OOH punchy</option>
                        <option>Social direct-response</option>
                        <option>Premium cinematic</option>
                      </select>
                    </ControlField>
                    <ControlField label="Visual style">
                      <select
                        className="field-input"
                        value={creativeControls.visualStyle}
                        onChange={(event) =>
                          setCreativeControls((current) => ({ ...current, visualStyle: event.target.value }))
                        }
                      >
                        <option>Cinematic editorial</option>
                        <option>Street documentary</option>
                        <option>Luxury lifestyle</option>
                      </select>
                    </ControlField>
                    <ControlField label="Hero cut">
                      <select
                        className="field-input"
                        value={creativeControls.selectedDuration}
                        onChange={(event) =>
                          setCreativeControls((current) => ({
                            ...current,
                            selectedDuration: event.target.value as Phase4Controls["selectedDuration"]
                          }))
                        }
                      >
                        <option value="15s">15s</option>
                        <option value="30s">30s</option>
                        <option value="60s">60s</option>
                      </select>
                    </ControlField>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button type="button" className="secondary-button" onClick={regeneratePhase4} disabled={isRunningPhase4}>
                      {isRunningPhase4 ? "Regenerating..." : "Regenerate creative"}
                    </button>
                    {approvedSlogan || approvedVisual || approvedScript ? (
                      <span className="approval-pill">Creative approvals active</span>
                    ) : null}
                  </div>

                  <div className="grid gap-3">
                    {[displayedPhase4?.primarySlogan, ...(displayedPhase4?.sloganVariants ?? [])]
                      .filter((slogan): slogan is string => Boolean(slogan))
                      .map((slogan) => (
                        <ApproveCard
                          key={slogan}
                          title="Slogan option"
                          body={slogan}
                          approved={approvedSlogan === slogan}
                          approveLabel="Approve slogan"
                          onApprove={() => setApprovedSlogan(slogan)}
                        />
                      ))}
                  </div>

                  <ApproveCard
                    title="Visual direction"
                    body={
                      displayedPhase4
                        ? `${displayedPhase4.visualBrief.styleDirection}. ${displayedPhase4.visualBrief.imagePrompt}`
                        : "Generate Phase 4 to create a visual direction."
                    }
                    approved={approvedVisual === (displayedPhase4?.visualBrief.styleDirection ?? "")}
                    approveLabel="Approve visual"
                    onApprove={() => setApprovedVisual(displayedPhase4?.visualBrief.styleDirection ?? "")}
                  />

                  <EditableCard
                    title={`${creativeControls.selectedDuration} script`}
                    value={scriptForCurrentDuration}
                    placeholder="Generate Phase 4 to create a script."
                    onChange={(value) =>
                      setPhase4Draft((current) =>
                        current
                          ? {
                              ...current,
                              scripts: {
                                ...current.scripts,
                                [creativeControls.selectedDuration]: value
                              }
                            }
                          : current
                      )
                    }
                  />

                  <div className="flex justify-end">
                    <button
                      type="button"
                      className={`secondary-button ${approvedScript === scriptForCurrentDuration ? "secondary-button-strong" : ""}`}
                      onClick={() => setApprovedScript(scriptForCurrentDuration)}
                      disabled={!scriptForCurrentDuration}
                    >
                      {approvedScript === scriptForCurrentDuration ? "Script approved" : "Approve script"}
                    </button>
                  </div>

                  {phase4Trace.length > 0 ? <TracePanel title="Phase 4 trace" lines={phase4Trace} /> : null}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function TopMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card relative rounded-[22px] border border-[var(--panel-border)] bg-white/66 px-4 py-4">
      <div className="text-xs uppercase tracking-[0.2em] text-[var(--ink-soft)]">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{value}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card relative rounded-[20px] border border-[var(--panel-border)] bg-white/66 p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-[var(--ink-soft)]">{label}</div>
      <div className="mt-2 text-lg font-semibold">{value}</div>
    </div>
  );
}

function ControlField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
      {children}
    </label>
  );
}

function TabButton({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" className={`tab-button ${active ? "tab-button-active" : ""}`} onClick={onClick}>
      {children}
    </button>
  );
}

function InsightCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[22px] border border-[var(--panel-border)] bg-white/70 p-4">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{body}</div>
    </div>
  );
}

function EditableCard({
  title,
  value,
  placeholder,
  onChange
}: {
  title: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-[22px] border border-[var(--panel-border)] bg-white/70 p-4">
      <div className="text-sm font-semibold">{title}</div>
      <textarea
        className="field-input mt-3 min-h-28 resize-none"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function ApproveCard({
  title,
  body,
  approved,
  approveLabel,
  onApprove
}: {
  title: string;
  body: string;
  approved: boolean;
  approveLabel: string;
  onApprove: () => void;
}) {
  return (
    <div className={`rounded-[22px] border p-4 ${approved ? "approved-card" : "border-[var(--panel-border)] bg-white/70"}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="text-sm font-semibold">{title}</div>
        <button type="button" className={`approve-button ${approved ? "approve-button-active" : ""}`} onClick={onApprove}>
          {approved ? "Approved" : approveLabel}
        </button>
      </div>
      <div className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">{body}</div>
    </div>
  );
}

function TracePanel({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-[22px] border border-[var(--panel-border)] bg-white/58 p-4">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-3 grid gap-2 text-sm text-[var(--ink-soft)]">
        {lines.map((line) => (
          <div key={line} className="soft-row">
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
