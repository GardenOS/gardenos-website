"use client";

import { useLocale } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";

type Tier = {
  members: number;
  price: number;
};

type Props = {
  currentMembers?: number;
  tiers?: Tier[];
  goalMembers?: number;
  currencySymbol?: string;
  title?: string;
  subtitle?: string;
};

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

/** Map route locales to stable BCP 47 tags so Node SSR and the browser use the same Intl rules. */
function intlLocaleForRouting(locale: string) {
  if (locale === "zh") return "zh-CN";
  if (locale === "en") return "en-US";
  return locale;
}

function formatCompactInt(value: number, intlLocale: string) {
  return new Intl.NumberFormat(intlLocale, { notation: "compact" }).format(value);
}

export function CrowdfundingProgress({
  currentMembers = 2,
  tiers = [
    { members: 50, price: 55 },
    { members: 200, price: 49 },
    { members: 500, price: 45 },
    { members: 1000, price: 39 },
    { members: 2000, price: 29 },
  ],
  goalMembers = 2000,
  currencySymbol = "$",
  title = "Crowdfunding Progress",
  subtitle = "As more members join, everyone unlocks lower pricing.",
}: Props) {
  const locale = useLocale();
  const intlLocale = intlLocaleForRouting(locale);

  const maxMembers = useMemo(() => Math.max(goalMembers, ...tiers.map((t) => t.members)), [goalMembers, tiers]);
  const rawProgress = clamp01(currentMembers / maxMembers);

  const currentTierIndex = useMemo(() => {
    const idx = tiers.findIndex((t) => currentMembers <= t.members);
    return idx === -1 ? tiers.length - 1 : idx;
  }, [currentMembers, tiers]);

  const lastTier = tiers[tiers.length - 1];
  const finalPrice = lastTier?.price ?? 0;
  /** Member count where the lowest price applies — not the same as campaign `maxMembers` when goal > last tier. */
  const lowestPriceAtMembers = lastTier?.members ?? maxMembers;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hasEntered, setHasEntered] = useState(false);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setHasEntered(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasEntered) return;
    const id = requestAnimationFrame(() => setAnimatedProgress(rawProgress));
    return () => cancelAnimationFrame(id);
  }, [hasEntered, rawProgress]);

  return (
    <section
      ref={containerRef}
      aria-label={title}
      className="overflow-hidden rounded-2xl border border-garden-200 bg-gradient-to-b from-white to-garden-50/80 shadow-sm"
    >
      <div className="px-6 py-8 sm:px-10 sm:py-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="inline-flex w-fit items-center gap-2 rounded-full border border-garden-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-garden-700">
              <span className="h-1.5 w-1.5 rounded-full bg-garden-500" aria-hidden />
              {title}
            </p>
            <h3 className="text-pretty text-xl font-semibold tracking-tight text-garden-950 sm:text-2xl">
              {currencySymbol}
              {finalPrice} unlocks at{" "}
              <span className="tabular-nums text-garden-700">
                {lowestPriceAtMembers.toLocaleString(intlLocale)}
              </span>{" "}
              members
            </h3>
            <p className="max-w-2xl text-sm leading-relaxed text-garden-800 sm:text-base">{subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-garden-200/80 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-garden-700">Members</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-garden-950 px-3 py-1 text-sm font-semibold text-white">
                <span className="relative inline-flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-garden-500 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-garden-500" />
                </span>
                <span className="tabular-nums">{currentMembers.toLocaleString(intlLocale)}</span>
              </span>
            </div>
            <div className="h-6 w-px bg-garden-200" aria-hidden />
            <div className="text-sm font-semibold text-garden-900">
              Goal: <span className="tabular-nums text-garden-700">{maxMembers.toLocaleString(intlLocale)}</span>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="relative">
            <div className="h-3 w-full rounded-full bg-white ring-1 ring-garden-200" aria-hidden />
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-garden-700 via-garden-500 to-garden-400 shadow-sm transition-[width] duration-1200 ease-out"
              style={{ width: `${(hasEntered ? animatedProgress : 0) * 100}%` }}
              aria-hidden
            />

            {tiers.map((tier) => {
              const leftPct = clamp01(tier.members / maxMembers) * 100;
              const reached = currentMembers >= tier.members;
              return (
                <div
                  key={tier.members}
                  className="absolute top-1/2 -translate-y-1/2"
                  style={{ left: `${leftPct}%` }}
                  aria-hidden
                >
                  <div
                    className={[
                      "h-5 w-5 -translate-x-1/2 rounded-full border-2 shadow-sm",
                      reached ? "border-white bg-garden-950" : "border-garden-300 bg-garden-100",
                    ].join(" ")}
                  />
                </div>
              );
            })}

            <div
              className="absolute top-1/2 -translate-y-1/2"
              style={{ left: `${rawProgress * 100}%` }}
              aria-hidden
            >
              <div className="relative -translate-x-1/2">
                <div className="h-6 w-6 rounded-full bg-garden-950 shadow-md ring-2 ring-white" />
                <div className="pointer-events-none absolute -inset-2 animate-pulse rounded-full bg-garden-600/20" />
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-5">
            {tiers.map((tier, idx) => {
              const isCurrent = idx === currentTierIndex;
              const reached = currentMembers >= tier.members;
              // All tiers use the same subtext pattern (no separate "target tier" branch).
              return (
                <div
                  key={tier.members}
                  className={[
                    "rounded-2xl border px-4 py-3 shadow-sm",
                    isCurrent ? "border-garden-300 bg-white" : "border-garden-200/80 bg-white/60",
                  ].join(" ")}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-garden-700">
                      {formatCompactInt(tier.members, intlLocale)} members
                    </p>
                    <span
                      className={[
                        "text-[11px] font-semibold",
                        reached ? "text-garden-700" : "text-garden-900/70",
                      ].join(" ")}
                    >
                      {reached ? "Unlocked" : "Locked"}
                    </span>
                  </div>
                  <p className="mt-2 text-lg font-semibold tracking-tight text-garden-950">
                    {currencySymbol}
                    {tier.price}
                    {idx === 0 ? null : (
                      <span className="ml-2 text-xs font-semibold text-garden-900/80">
                        down from {currencySymbol}
                        {tiers[0]?.price ?? 0}
                      </span>
                    )}
                  </p>
                  {isCurrent ? (
                    <p className="mt-2 text-xs leading-relaxed text-garden-700">
                      Current tier: next drop at{" "}
                      <span className="font-semibold tabular-nums">{tier.members.toLocaleString(intlLocale)}</span>.
                    </p>
                  ) : (
                    <p className="mt-2 text-xs leading-relaxed text-garden-700/80">
                      Price drops as we hit this milestone.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

