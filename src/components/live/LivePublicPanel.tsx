"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

type LiveStage = "prelive" | "live" | "replay" | "ended" | "none";

type LiveEvent = {
  id: string;
  slug: string;
  title: string;
  titleEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  status: "prelive" | "live" | "replay" | "ended";
  visibility: "draft" | "published" | "archived";
  locale: string;
  promoVideoUrl: string | null;
  posterUrl: string | null;
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

  const withoutSchedule = upcoming.filter((event) => !event.scheduledStartAt);
  if (withoutSchedule.length) {
    return withoutSchedule[0] ?? null;
  }

  return [...upcoming].sort((left, right) => {
    const startDiff = toTimestamp(left.scheduledStartAt) - toTimestamp(right.scheduledStartAt);
    if (startDiff !== 0) return startDiff;
    return toTimestamp(left.createdAt) - toTimestamp(right.createdAt);
  })[0] ?? null;
}

function getDisplayTitle(event: LiveEvent, locale: string): string {
  if (locale === "en") {
    return event.titleEn?.trim() || event.title;
  }
  return event.title;
}

function getDisplayDescription(event: LiveEvent, locale: string): string | null {
  if (locale === "en") {
    return event.descriptionEn?.trim() || event.description?.trim() || null;
  }
  return event.description?.trim() || event.descriptionEn?.trim() || null;
}

export function LivePublicPanel() {
  const t = useTranslations("liveRuntime");
  const locale = useLocale();

  const [currentEvent, setCurrentEvent] = useState<LiveEvent | null>(null);
  const [events, setEvents] = useState<LiveEvent[]>([]);

  useEffect(() => {
    async function load() {
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

        setCurrentEvent(currentData.event);
        setEvents(eventsData.events ?? []);
      } catch {
        // Keep page functional even if the latest live data cannot be loaded.
      }
    }

    void load();
  }, [t]);

  const nextUpcomingEvent = useMemo(() => pickNearestUpcomingEvent(events), [events]);
  const contentEvent = currentEvent ?? nextUpcomingEvent;
  const liveCopy = contentEvent ? getDisplayDescription(contentEvent, locale) : null;
  const headline = contentEvent
    ? getDisplayTitle(contentEvent, locale)
    : locale === "en"
      ? "Live Event"
      : "直播";

  const preliveEvents = events.filter((event) => event.status === "prelive");
  const liveEvents = events.filter((event) => event.status === "live");
  const replayEvents = events.filter((event) => event.status === "replay");
  const endedEvents = events.filter((event) => event.status === "ended");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-garden-950 sm:text-4xl">
          {headline}
        </h1>
      </header>

      {liveCopy ? (
        <section className="rounded-2xl bg-garden-50 px-6 py-6 sm:px-8">
          <div
            className="text-garden-900 leading-relaxed [&>*+*]:mt-3 [&_h1]:text-3xl [&_h1]:font-semibold [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:text-xl [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-garden-700 [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: liveCopy }}
          />
        </section>
      ) : null}

      {/* Promo video and poster for the nearest upcoming / current event */}
      {(() => {
        const promoEvent = contentEvent;
        if (!promoEvent) return null;
        const promoEmbed = toYoutubeEmbedUrl(promoEvent.promoVideoUrl);
        const isDirectVideo = promoEvent.promoVideoUrl && !promoEmbed;
        const hasVideo = Boolean(promoEmbed || isDirectVideo);
        const hasPoster = Boolean(promoEvent.posterUrl) && !hasVideo;
        if (!promoEmbed && !isDirectVideo && !hasPoster) return null;
        return (
          <section className="space-y-4">
            {promoEmbed ? (
              <div className="overflow-hidden rounded-2xl border border-garden-200 bg-black shadow-sm">
                <iframe
                  title="Promo video"
                  src={promoEmbed}
                  className="aspect-video w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            ) : isDirectVideo ? (
              <div className="overflow-hidden rounded-2xl border border-garden-200 bg-black shadow-sm">
                <video
                  src={promoEvent.promoVideoUrl!}
                  controls
                  className="aspect-video w-full"
                />
              </div>
            ) : null}
            {hasPoster ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={promoEvent.posterUrl!}
                alt={getDisplayTitle(promoEvent, locale)}
                className="w-full rounded-2xl border border-garden-200 object-cover shadow-sm"
              />
            ) : null}
          </section>
        );
      })()}
      {/* Temporarily hidden: current-stage stream panel */}
      {/*
      <section className="rounded-2xl border border-garden-200 bg-white px-6 py-6 shadow-sm sm:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-garden-300 bg-garden-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-garden-700">
            {t("currentStage")}: {stageLabel}
          </span>
          {currentEvent ? (
            <span className="text-sm font-medium text-garden-700">{getDisplayTitle(currentEvent, locale)}</span>
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
      */}

      <section className="rounded-2xl border border-garden-200 bg-white px-6 py-6 shadow-sm sm:px-8">
        <h2 className="text-lg font-semibold text-garden-950">{t("rsvpTitle")}</h2>

        <div className="mt-4 rounded-2xl border border-garden-200 bg-garden-50 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-garden-700">{t("nextEventLabel")}</p>
          {nextUpcomingEvent ? (
            <>
              <p className="mt-2 text-base font-semibold text-garden-950">{getDisplayTitle(nextUpcomingEvent, locale)}</p>
              <p className="mt-1 text-sm text-garden-700">
                {formatDate(nextUpcomingEvent.scheduledStartAt, locale)}
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

      <section className="grid gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-garden-200 bg-white px-5 py-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-garden-700">{t("upcomingTitle")}</h3>
          <ul className="mt-3 space-y-3 text-sm text-garden-800">
            {preliveEvents.length ? (
              preliveEvents.map((event) => (
                <li key={event.id}>
                  <p className="font-medium text-garden-900">{getDisplayTitle(event, locale)}</p>
                  <p className="text-xs text-garden-600">{formatDate(event.scheduledStartAt, locale)}</p>
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
                  <p className="font-medium text-garden-900">{getDisplayTitle(event, locale)}</p>
                  <p className="text-xs text-garden-600">{formatDate(event.actualStartAt ?? event.scheduledStartAt, locale)}</p>
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
                  <p className="font-medium text-garden-900">{getDisplayTitle(event, locale)}</p>
                  <p className="text-xs text-garden-600">{formatDate(event.actualEndAt ?? event.updatedAt, locale)}</p>
                </li>
              ))
            ) : (
              <li className="text-garden-600">{t("emptyReplay")}</li>
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-garden-200 bg-white px-5 py-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-garden-700">{t("endedTitle")}</h3>
          <ul className="mt-3 space-y-3 text-sm text-garden-800">
            {endedEvents.length ? (
              endedEvents.map((event) => (
                <li key={event.id}>
                  <p className="font-medium text-garden-900">{getDisplayTitle(event, locale)}</p>
                  <p className="text-xs text-garden-600">{formatDate(event.actualEndAt ?? event.updatedAt, locale)}</p>
                </li>
              ))
            ) : (
              <li className="text-garden-600">{t("emptyEnded")}</li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}
