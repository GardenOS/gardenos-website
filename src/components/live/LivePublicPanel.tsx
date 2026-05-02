"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

type LiveStage = "prelive" | "live" | "replay" | "none";

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

type CurrentLiveResponse = {
  ok: boolean;
  stage: LiveStage;
  event: LiveEvent | null;
};

type EventsResponse = {
  ok: boolean;
  events: LiveEvent[];
};

function toYoutubeEmbedUrl(rawUrl?: string | null): string | null {
  if (!rawUrl) return null;

  try {
    const input = rawUrl.trim();
    if (!input) return null;

    const url = new URL(input);
    const host = url.hostname.toLowerCase();

    if (host.includes("youtube.com")) {
      if (url.pathname.startsWith("/embed/")) return input;

      const watchId = url.searchParams.get("v");
      if (watchId) return `https://www.youtube.com/embed/${watchId}`;

      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] === "live" && parts[1]) {
        return `https://www.youtube.com/embed/${parts[1]}`;
      }
    }

    if (host === "youtu.be") {
      const id = url.pathname.replace("/", "").trim();
      if (id) return `https://www.youtube.com/embed/${id}`;
    }

    return null;
  } catch {
    return null;
  }
}

function pickStageUrl(stage: LiveStage, event: LiveEvent | null): string | null {
  if (!event) return null;

  if (stage === "live") return event.liveUrl ?? event.warmupUrl ?? event.replayUrl;
  if (stage === "prelive") return event.warmupUrl ?? event.liveUrl ?? event.replayUrl;
  if (stage === "replay") return event.replayUrl ?? event.liveUrl ?? event.warmupUrl;
  return null;
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

export function LivePublicPanel() {
  const t = useTranslations("liveRuntime");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [stage, setStage] = useState<LiveStage>("none");
  const [currentEvent, setCurrentEvent] = useState<LiveEvent | null>(null);
  const [events, setEvents] = useState<LiveEvent[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [currentRes, eventsRes] = await Promise.all([
          fetch("/api/live/current", { cache: "no-store" }),
          fetch("/api/live/events", { cache: "no-store" }),
        ]);

        if (!currentRes.ok || !eventsRes.ok) {
          throw new Error("Failed to load live data");
        }

        const currentData = (await currentRes.json()) as CurrentLiveResponse;
        const eventsData = (await eventsRes.json()) as EventsResponse;

        setStage(currentData.stage);
        setCurrentEvent(currentData.event);
        setEvents(eventsData.events ?? []);
      } catch {
        setError(t("loadError"));
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [t]);

  const stageLabel = useMemo(() => {
    if (stage === "live") return t("stageLive");
    if (stage === "prelive") return t("stagePrelive");
    if (stage === "replay") return t("stageReplay");
    return t("stageNone");
  }, [stage, t]);

  const selectedStreamUrl = pickStageUrl(stage, currentEvent);
  const embedUrl = toYoutubeEmbedUrl(selectedStreamUrl);
  const nextUpcomingEvent = useMemo(() => pickNearestUpcomingEvent(events), [events]);

  const preliveEvents = events.filter((event) => event.status === "prelive");
  const liveEvents = events.filter((event) => event.status === "live");
  const replayEvents = events.filter((event) => event.status === "replay");

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-garden-200 bg-white px-6 py-6 shadow-sm sm:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-garden-300 bg-garden-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-garden-700">
            {t("currentStage")}: {stageLabel}
          </span>
          {currentEvent ? (
            <span className="text-sm font-medium text-garden-700">{currentEvent.title}</span>
          ) : null}
        </div>

        <div className="mt-4">
          {loading ? (
            <p className="text-sm text-garden-700">{t("loading")}</p>
          ) : error ? (
            <p className="text-sm text-red-700">{error}</p>
          ) : embedUrl ? (
            <div className="overflow-hidden rounded-2xl border border-garden-200 bg-black shadow-sm">
              <iframe
                title="Live stream"
                src={embedUrl}
                className="aspect-video w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          ) : selectedStreamUrl ? (
            <div className="rounded-xl border border-garden-200 bg-garden-50 px-4 py-3 text-sm text-garden-800">
              <p>{t("directLinkHint")}</p>
              <a href={selectedStreamUrl} target="_blank" rel="noreferrer" className="mt-1 block break-all text-garden-700 underline">
                {selectedStreamUrl}
              </a>
            </div>
          ) : (
            <p className="text-sm text-garden-700">{t("noCurrentStream")}</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-garden-200 bg-white px-6 py-6 shadow-sm sm:px-8">
        <h2 className="text-lg font-semibold text-garden-950">{t("rsvpTitle")}</h2>
        <p className="mt-2 text-sm text-garden-800">{t("rsvpLead")}</p>

        <div className="mt-4 rounded-2xl border border-garden-200 bg-garden-50 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-garden-700">{t("nextEventLabel")}</p>
          {nextUpcomingEvent ? (
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

        <div className="mt-4 rounded-2xl border border-garden-200 bg-white/80 px-4 py-4">
          <p className="text-sm text-garden-700">{t("reserveEntryBody")}</p>
          <div className="mt-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-full bg-garden-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-garden-700"
            >
              {t("reserveEntryButton")}
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-garden-200 bg-white px-5 py-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-garden-700">{t("upcomingTitle")}</h3>
          <ul className="mt-3 space-y-3 text-sm text-garden-800">
            {preliveEvents.length ? (
              preliveEvents.map((event) => (
                <li key={event.id}>
                  <p className="font-medium text-garden-900">{event.title}</p>
                  <p className="text-xs text-garden-600">{formatDate(event.scheduledStartAt, event.locale)}</p>
                </li>
              ))
            ) : (
              <li className="text-garden-600">{t("emptyUpcoming")}</li>
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-garden-200 bg-white px-5 py-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-garden-700">{t("liveNowTitle")}</h3>
          <ul className="mt-3 space-y-3 text-sm text-garden-800">
            {liveEvents.length ? (
              liveEvents.map((event) => (
                <li key={event.id}>
                  <p className="font-medium text-garden-900">{event.title}</p>
                  <p className="text-xs text-garden-600">{formatDate(event.actualStartAt ?? event.scheduledStartAt, event.locale)}</p>
                </li>
              ))
            ) : (
              <li className="text-garden-600">{t("emptyLive")}</li>
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-garden-200 bg-white px-5 py-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-garden-700">{t("replayTitle")}</h3>
          <ul className="mt-3 space-y-3 text-sm text-garden-800">
            {replayEvents.length ? (
              replayEvents.map((event) => (
                <li key={event.id}>
                  <p className="font-medium text-garden-900">{event.title}</p>
                  <p className="text-xs text-garden-600">{formatDate(event.actualEndAt ?? event.updatedAt, event.locale)}</p>
                </li>
              ))
            ) : (
              <li className="text-garden-600">{t("emptyReplay")}</li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}
