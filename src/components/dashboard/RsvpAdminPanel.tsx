"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type LiveEvent = {
  id: string;
  title: string;
  slug: string;
  status: "prelive" | "live" | "replay";
  visibility: "draft" | "published" | "archived";
  scheduledStartAt: string | null;
};

type RsvpRecord = {
  id: string;
  email: string;
  fullName: string | null;
  status: string;
  locale: string | null;
  consentMarketing: boolean;
  registeredAt: string;
};

export function RsvpAdminPanel() {
  const t = useTranslations("dashboardRsvp");

  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [rsvps, setRsvps] = useState<RsvpRecord[]>([]);
  const [rsvpsLoaded, setRsvpsLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEvents() {
      setError("");
      try {
        const res = await fetch("/api/live/events", { cache: "no-store" });
        const data = (await res.json().catch(() => null)) as {
          ok?: boolean;
          events?: LiveEvent[];
          error?: string;
        } | null;
        if (!res.ok || !data?.ok) {
          setError(data?.error || t("loadEventsError"));
          return;
        }
        setEvents(data.events ?? []);
      } catch {
        setError(t("loadEventsError"));
      }
    }
    void loadEvents();
  }, [t]);

  async function loadRsvps() {
    if (!selectedEventId) return;
    setError("");
    setRsvpsLoaded(false);
    try {
      const res = await fetch(
        `/api/live/events/${selectedEventId}/rsvps?limit=500&offset=0`,
        { cache: "no-store" }
      );
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        rsvps?: RsvpRecord[];
        error?: string;
      } | null;
      if (!res.ok || !data?.ok) {
        setError(data?.error || t("loadRsvpError"));
        return;
      }
      setRsvps(data.rsvps ?? []);
      setRsvpsLoaded(true);
    } catch {
      setError(t("loadRsvpError"));
    }
  }

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-garden-950">{t("title")}</h1>
        <p className="text-sm text-garden-800">{t("lead")}</p>
      </header>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <section className="rounded-2xl border border-garden-200 bg-white px-6 py-6 shadow-sm">
        <p className="mb-3 text-sm font-medium text-garden-800">{t("eventSelectLabel")}</p>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              setRsvps([]);
              setRsvpsLoaded(false);
            }}
            className="min-w-[260px] flex-1 rounded-lg border border-garden-200 px-3 py-2 text-sm"
          >
            <option value="">{t("eventSelectPlaceholder")}</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title} — {event.status}
                {event.scheduledStartAt
                  ? ` (${new Date(event.scheduledStartAt).toLocaleDateString()})`
                  : ""}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void loadRsvps()}
            disabled={!selectedEventId}
            className="rounded-full bg-garden-600 px-4 py-2 text-sm font-semibold text-white hover:bg-garden-700 disabled:opacity-50"
          >
            {t("loadButton")}
          </button>
        </div>
      </section>

      {rsvpsLoaded ? (
        <section className="rounded-2xl border border-garden-200 bg-white px-6 py-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-garden-900">
                {selectedEvent?.title}
              </h2>
              <p className="text-xs text-garden-600">
                {t("total", { count: rsvps.length })}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadRsvps()}
              className="rounded-full border border-garden-300 px-4 py-2 text-sm font-semibold text-garden-800 hover:bg-garden-50"
            >
              {t("refreshButton")}
            </button>
          </div>

          {rsvps.length === 0 ? (
            <p className="text-sm text-garden-700">{t("empty")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-garden-600">
                  <tr>
                    <th className="py-2 pr-4">{t("colName")}</th>
                    <th className="py-2 pr-4">{t("colEmail")}</th>
                    <th className="py-2 pr-4">{t("colStatus")}</th>
                    <th className="py-2 pr-4">{t("colLocale")}</th>
                    <th className="py-2 pr-4">{t("colMarketing")}</th>
                    <th className="py-2">{t("colRegisteredAt")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rsvps.map((row) => (
                    <tr key={row.id} className="border-t border-garden-100">
                      <td className="py-2 pr-4">{row.fullName || "—"}</td>
                      <td className="py-2 pr-4">{row.email}</td>
                      <td className="py-2 pr-4">
                        <span className="rounded-full bg-garden-100 px-2 py-0.5 text-xs font-medium text-garden-800">
                          {row.status}
                        </span>
                      </td>
                      <td className="py-2 pr-4">{row.locale || "—"}</td>
                      <td className="py-2 pr-4">
                        {row.consentMarketing ? t("yes") : t("no")}
                      </td>
                      <td className="py-2 text-garden-600">
                        {new Date(row.registeredAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
