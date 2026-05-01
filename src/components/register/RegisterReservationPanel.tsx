"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ClerkLoaded, ClerkLoading, SignInButton, useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

type LiveEvent = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: "prelive" | "live" | "replay";
  visibility: "draft" | "published" | "archived";
  locale: string;
  warmupUrl: string | null;
  liveUrl: string | null;
  replayUrl: string | null;
  scheduledStartAt: string | null;
  actualStartAt: string | null;
  actualEndAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type EventsResponse = {
  ok: boolean;
  events: LiveEvent[];
};

type RsvpResponse = {
  ok: boolean;
  error?: string;
};

function toTimestamp(value: string | null): number {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
}

function pickNearestUpcomingEvent(events: LiveEvent[]): LiveEvent | null {
  const upcoming = events.filter((event) => event.status === "prelive");
  if (!upcoming.length) return null;

  return [...upcoming].sort((left, right) => {
    const startDiff = toTimestamp(left.scheduledStartAt) - toTimestamp(right.scheduledStartAt);
    if (startDiff !== 0) return startDiff;
    return toTimestamp(left.createdAt) - toTimestamp(right.createdAt);
  })[0] ?? null;
}

function formatDate(value: string | null, locale: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getPreferredLocale(): "zh" | "en" {
  return document.documentElement.lang?.startsWith("zh") ? "zh" : "en";
}

const inputClass =
  "mt-1 w-full rounded-xl border border-garden-200 bg-garden-50/80 px-4 py-2.5 text-sm text-garden-900 outline-none ring-garden-500/30 placeholder:text-garden-400";

export function RegisterReservationPanel() {
  const t = useTranslations("register");
  const pathname = usePathname();
  const { isLoaded, isSignedIn, user } = useUser();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setLoadError(null);

      try {
        const response = await fetch("/api/live/events", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to load live events");
        }

        const data = (await response.json()) as EventsResponse;
        setEvents(data.events ?? []);
      } catch {
        setLoadError(t("reserveLoadError"));
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [t]);

  const nextUpcomingEvent = useMemo(() => pickNearestUpcomingEvent(events), [events]);
  const signedInEmail = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress ?? "";
  const signedInName = user?.fullName ?? [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  async function submitReservation() {
    setErrorMessage(null);

    if (!nextUpcomingEvent) {
      setErrorMessage(t("noUpcomingEvent"));
      return;
    }

    if (isSignedIn && !signedInEmail) {
      setErrorMessage(t("accountMissingEmail"));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/live/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: nextUpcomingEvent.id,
          fullName: isSignedIn ? undefined : fullName,
          email: isSignedIn ? undefined : email,
          locale: getPreferredLocale(),
          source: isSignedIn ? "register-page-member" : "register-page-guest",
          consentMarketing: false,
          consentVersion: "v1",
        }),
      });

      const data = (await response.json().catch(() => null)) as RsvpResponse | null;
      if (!response.ok || !data?.ok) {
        setErrorMessage(data?.error || t("submitError"));
        return;
      }

      setSubmitted(true);
      setFullName("");
      setEmail("");
    } catch {
      setErrorMessage(t("submitError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div
        className="rounded-2xl border border-garden-300/80 bg-gradient-to-br from-garden-50 to-white px-6 py-8 shadow-sm sm:px-8 sm:py-10"
        role="status"
        aria-live="polite"
      >
        <h3 className="text-balance text-xl font-semibold tracking-tight text-garden-800 sm:text-2xl">
          {t("successTitle")}
        </h3>
        <p className="mt-4 max-w-lg text-pretty text-base leading-relaxed text-garden-700">
          {t("successBody")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-garden-200 bg-white px-5 py-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-garden-700">{t("nextEventLabel")}</p>
        {loading ? (
          <p className="mt-2 text-sm text-garden-700">{t("reserveLoading")}</p>
        ) : loadError ? (
          <p className="mt-2 text-sm text-red-700">{loadError}</p>
        ) : nextUpcomingEvent ? (
          <>
            <p className="mt-2 text-base font-semibold text-garden-950">{nextUpcomingEvent.title}</p>
            <p className="mt-1 text-sm text-garden-700">
              {formatDate(nextUpcomingEvent.scheduledStartAt, nextUpcomingEvent.locale)}
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-garden-700">{t("noUpcomingEvent")}</p>
        )}
      </div>

      <ClerkLoading>
        <div className="h-28 rounded-2xl bg-garden-100/70" aria-hidden />
      </ClerkLoading>

      <ClerkLoaded>
        {isSignedIn ? (
          <div className="rounded-2xl border border-garden-200 bg-white px-5 py-5 shadow-sm">
            <p className="text-sm font-medium text-garden-900">{t("memberReadyTitle")}</p>
            <p className="mt-1 text-sm leading-relaxed text-garden-700">
              {t("memberReadyBody", {
                name: signedInName || user?.username || t("memberFallbackName"),
                email: signedInEmail || t("memberMissingEmailShort"),
              })}
            </p>
            <button
              type="button"
              disabled={isSubmitting || !nextUpcomingEvent || !isLoaded}
              onClick={() => {
                void submitReservation();
              }}
              className="mt-4 w-full rounded-full bg-garden-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-garden-700 disabled:opacity-70 sm:w-auto sm:px-8"
            >
              {isSubmitting ? t("submitInFlight") : t("memberSubmit")}
            </button>
          </div>
        ) : (
          <form
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              void submitReservation();
            }}
            className="space-y-5"
          >
            <div className="rounded-2xl border border-garden-200 bg-white px-5 py-5 shadow-sm">
              <p className="text-sm font-medium text-garden-900">{t("guestTitle")}</p>
              <p className="mt-1 text-sm leading-relaxed text-garden-700">{t("guestBody")}</p>
            </div>

            <div>
              <label
                className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-garden-700"
                htmlFor="reg-name"
              >
                {t("labelName")}
              </label>
              <input
                id="reg-name"
                name="fullName"
                type="text"
                autoComplete="nickname"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className={inputClass}
                placeholder={t("placeholderName")}
              />
            </div>

            <div>
              <label
                className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-garden-700"
                htmlFor="reg-email"
              >
                {t("labelEmail")}
              </label>
              <input
                id="reg-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClass}
                placeholder={t("placeholderEmail")}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting || !nextUpcomingEvent}
                className="w-full rounded-full bg-garden-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-garden-700 disabled:opacity-70 sm:w-auto sm:px-8"
              >
                {isSubmitting ? t("submitInFlight") : t("guestSubmit")}
              </button>

              <SignInButton mode="modal" fallbackRedirectUrl={pathname} forceRedirectUrl={pathname}>
                <button
                  type="button"
                  className="w-full rounded-full border border-garden-300 bg-white px-5 py-3 text-sm font-semibold text-garden-800 shadow-sm transition hover:border-garden-400 hover:bg-garden-50 sm:w-auto sm:px-8"
                >
                  {t("signInButton")}
                </button>
              </SignInButton>
            </div>

            <p className="text-sm leading-relaxed text-garden-700">{t("signInHint")}</p>
          </form>
        )}
      </ClerkLoaded>

      {errorMessage ? (
        <p className="text-sm leading-relaxed text-red-700" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}