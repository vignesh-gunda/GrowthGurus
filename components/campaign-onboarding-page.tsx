"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  defaultCampaignInput,
  platformOptions,
  regionOptions,
  storeCampaignInput,
  type CampaignOnboardingInput,
  type SupportedPlatform
} from "@/lib/mock-campaign";

export function CampaignOnboardingPage() {
  const router = useRouter();
  const [formState, setFormState] = useState<CampaignOnboardingInput>(defaultCampaignInput);

  return (
    <main className="min-h-screen px-4 py-5 md:px-8 md:py-8">
      <div className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-7xl gap-6 xl:grid-cols-[0.86fr_1.14fr]">
        <section className="surface-panel surface-panel-dark flex flex-col justify-between overflow-hidden p-6 md:p-8">
          <div>
            <div className="brand-badge mt-4">Growth Gurus</div>
            <h1 className="brand-tagline mt-5 max-w-xl text-4xl font-semibold tracking-[-0.04em] text-white md:text-6xl">
              Marketing on Auto Pilot
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/68 md:text-lg">
              Fill in your campaign brief below. The workspace uses your inputs to steer the geo-social scan, zone scoring, and downstream agent outputs.
            </p>
          </div>
        </section>

        <section className="surface-panel relative overflow-hidden p-4 md:p-5">
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[rgba(216,115,64,0.15)] to-transparent" />
          <div className="relative">
            <div className="rounded-[26px] border border-[var(--panel-border)] bg-white/72 p-5 shadow-[0_20px_50px_rgba(9,15,31,0.06)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="eyebrow">Onboarding</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">
                    Campaign setup
                  </h2>
                </div>
                <Link href="/workspace" className="ghost-link">
                  Open workspace
                </Link>
              </div>

              <form
                className="mt-5 grid gap-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  storeCampaignInput(formState);
                  router.push("/workspace");
                }}
              >
                <Field label="Product name">
                  <input
                    className="field-input"
                    value={formState.productName}
                    onChange={(event) =>
                      setFormState((current) => ({ ...current, productName: event.target.value }))
                    }
                  />
                </Field>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Category">
                    <input
                      className="field-input"
                      value={formState.productCategory}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          productCategory: event.target.value
                        }))
                      }
                    />
                  </Field>

                  <Field label="Target region">
                    <select
                      className="field-input"
                      value={formState.targetRegion}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          targetRegion: event.target.value as CampaignOnboardingInput["targetRegion"]
                        }))
                      }
                    >
                      {regionOptions.map((region) => (
                        <option key={region} value={region}>
                          {region}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field label="Core promise">
                  <textarea
                    className="field-input min-h-24 resize-none"
                    value={formState.corePromise}
                    onChange={(event) =>
                      setFormState((current) => ({ ...current, corePromise: event.target.value }))
                    }
                  />
                </Field>

                <Field label="Brand personality">
                  <input
                    className="field-input"
                    value={formState.brandPersonality}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        brandPersonality: event.target.value
                      }))
                    }
                  />
                </Field>

                <Field label="Target customer">
                  <textarea
                    className="field-input min-h-28 resize-none"
                    value={formState.targetCustomer}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        targetCustomer: event.target.value
                      }))
                    }
                  />
                </Field>

                <Field label="Total budget (USD)">
                  <input
                    className="field-input"
                    type="number"
                    min={1000}
                    step={1000}
                    value={formState.totalBudget}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        totalBudget: Number(event.target.value) || 0
                      }))
                    }
                  />
                </Field>

                <Field label="Source platforms">
                  <div className="grid gap-3 md:grid-cols-2">
                    {platformOptions.map((platform) => {
                      const isChecked = formState.platforms.includes(platform.id);

                      return (
                        <label key={platform.id} className={`platform-chip ${isChecked ? "platform-chip-active" : ""}`}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() =>
                              setFormState((current) => ({
                                ...current,
                                platforms: isChecked
                                  ? current.platforms.filter((item) => item !== platform.id)
                                  : [...current.platforms, platform.id as SupportedPlatform]
                              }))
                            }
                          />
                          <span className="text-sm font-medium">{platform.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </Field>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button type="submit" className="primary-button">
                    Continue to workspace
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
      {children}
    </label>
  );
}
