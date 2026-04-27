"use client";

import { useRouter } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

const OPTION_KEYS = ["o1", "o2", "o3", "o4", "o5"] as const;

export function HomeMowingCostSurvey() {
  const t = useTranslations("home.survey");
  const locale = useLocale();
  const router = useRouter();
  const [phase, setPhase] = useState<"idle" | "thanks" | "error">("idle");
  const [busy, setBusy] = useState(false);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
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
        if (redirectTimer.current) clearTimeout(redirectTimer.current);
        redirectTimer.current = setTimeout(() => {
          router.push("/register");
        }, 2000);
      } catch {
        setPhase("error");
      } finally {
        setBusy(false);
      }
    },
    [busy, phase, locale, router]
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
            <p className="mt-8 text-center text-base font-semibold text-green-800" role="status" aria-live="polite">
              {t("thanks")}
            </p>
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
