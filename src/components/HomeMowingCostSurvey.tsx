"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useState } from "react";

const OPTION_KEYS = ["o1", "o2", "o3", "o4", "o5"] as const;

type SurveySlotId = (typeof OPTION_KEYS)[number];

type SurveyResults = { total: number; bySlot: Record<SurveySlotId, number> };

export function HomeMowingCostSurvey() {
  const t = useTranslations("home.survey");
  const locale = useLocale();
  const [phase, setPhase] = useState<"idle" | "thanks" | "error">("idle");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<SurveyResults | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState(false);

  const loadResults = useCallback(async () => {
    setResultsLoading(true);
    setResultsError(false);
    setResults(null);
    try {
      const res = await fetch("/api/survey/results", { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; total?: number; bySlot?: Record<string, number> }
        | null;
      if (!res.ok || !data?.ok || typeof data.total !== "number" || !data.bySlot) {
        setResultsError(true);
        return;
      }
      const bySlot = OPTION_KEYS.reduce(
        (acc, key) => {
          acc[key] = Number(data.bySlot![key]) || 0;
          return acc;
        },
        {} as Record<SurveySlotId, number>
      );
      setResults({ total: data.total, bySlot });
    } catch {
      setResultsError(true);
    } finally {
      setResultsLoading(false);
    }
  }, []);

  const submit = useCallback(
    async (answer: string) => {
      if (busy || phase === "thanks") return;
      setBusy(true);
      setPhase((p) => (p === "error" ? "idle" : p));
      try {
        const res = await fetch("/api/survey", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answer, lang: locale }),
        });
        const data = (await res.json().catch(() => null)) as { ok?: boolean } | null;
        if (!res.ok || !data?.ok) {
          setPhase("error");
          return;
        }
        setPhase("thanks");
        void loadResults();
      } catch {
        setPhase("error");
      } finally {
        setBusy(false);
      }
    },
    [busy, phase, locale, loadResults]
  );

  return (
    <section aria-labelledby="mowing-survey-heading" className="bg-white">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl rounded-2xl bg-green-50 px-6 py-8 shadow-sm ring-1 ring-green-200/60 sm:px-8 sm:py-10">
          <h2
            id="mowing-survey-heading"
            className="text-center text-2xl font-black tracking-tight text-garden-950 sm:text-3xl"
          >
            {t("title")}
          </h2>
          <p className="mt-3 text-center text-sm leading-relaxed text-garden-800 sm:text-base">
            {t("subtitle")}
          </p>

          {phase === "thanks" ? (
            <div className="mt-8 space-y-6">
              <p className="text-center text-base font-semibold text-green-800" role="status" aria-live="polite">
                {t("thanks")}
              </p>

              {resultsLoading ? (
                <p className="text-center text-sm text-garden-700">{t("resultsLoading")}</p>
              ) : null}

              {resultsError && !resultsLoading ? (
                <p className="text-center text-sm text-amber-800">{t("resultsLoadError")}</p>
              ) : null}

              {results && !resultsLoading ? (
                <div className="rounded-xl border border-green-200/80 bg-white/90 px-4 py-5 sm:px-5">
                  <h3 className="text-center text-lg font-bold text-garden-950">{t("resultsTitle")}</h3>
                  <p className="mt-1 text-center text-xs text-garden-700 sm:text-sm">
                    {t("resultsSubtitle", { count: results.total })}
                  </p>
                  <ul className="mt-5 space-y-4" aria-label={t("resultsTitle")}>
                    {OPTION_KEYS.map((key) => {
                      const label = t(`options.${key}`);
                      const votes = results.bySlot[key] ?? 0;
                      const percent = results.total > 0 ? Math.round((votes / results.total) * 100) : 0;
                      return (
                        <li key={key} className="space-y-1.5">
                          <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1 text-sm text-garden-900">
                            <span className="min-w-0 flex-1 font-medium leading-snug">{label}</span>
                            <span className="shrink-0 tabular-nums text-garden-700">
                              {t("resultsRow", { percent, votes })}
                            </span>
                          </div>
                          <div
                            className="h-2.5 overflow-hidden rounded-full bg-green-100"
                            role="progressbar"
                            aria-valuenow={percent}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={label}
                          >
                            <div
                              className="h-full min-w-0 rounded-full bg-green-600 transition-[width] duration-300"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              {phase === "error" ? (
                <p className="mt-6 text-center text-sm font-medium text-red-700" role="alert">
                  {t("error")}
                </p>
              ) : null}
              <div className={`flex flex-col gap-3 ${phase === "error" ? "mt-4" : "mt-8"}`}>
                {OPTION_KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    disabled={busy}
                    onClick={() => submit(t(`options.${key}`))}
                    className="w-full rounded-xl border border-green-200 bg-white px-5 py-4 text-left text-base font-semibold text-garden-900 shadow-sm transition hover:border-green-400 hover:bg-green-100/60 disabled:opacity-60"
                  >
                    {t(`options.${key}`)}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
