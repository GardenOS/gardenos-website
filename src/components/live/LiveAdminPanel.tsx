"use client";

import { FormEvent, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type LiveEvent = {
  id: string;
  title: string;
  slug: string;
  status: "prelive" | "live" | "replay";
  visibility: "draft" | "published" | "archived";
  warmupUrl: string | null;
  liveUrl: string | null;
  replayUrl: string | null;
};

type RsvpRecord = {
  id: string;
  email: string;
  fullName: string | null;
  status: string;
  registeredAt: string;
};

export function LiveAdminPanel() {
  const t = useTranslations("dashboardLive");

  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [status, setStatus] = useState<"prelive" | "live" | "replay">("prelive");
  const [warmupUrl, setWarmupUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [replayUrl, setReplayUrl] = useState("");
  const [rsvps, setRsvps] = useState<RsvpRecord[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [scheduledStartAt, setScheduledStartAt] = useState("");
  const [createStatus, setCreateStatus] = useState<"prelive" | "live" | "replay">("prelive");
  const [visibility, setVisibility] = useState<"published" | "draft">("published");

  async function loadEvents() {
    setError("");
    try {
      const response = await fetch("/api/live/events", { cache: "no-store" });
      const data = (await response.json()) as { ok?: boolean; events?: LiveEvent[]; error?: string };
      if (!response.ok || !data.ok) {
        setError(data.error || t("loadError"));
        return;
      }
      const nextEvents = data.events ?? [];
      setEvents(nextEvents);
      if (!selectedId && nextEvents[0]) {
        const first = nextEvents[0];
        setSelectedId(first.id);
        setStatus(first.status);
        setWarmupUrl(first.warmupUrl ?? "");
        setLiveUrl(first.liveUrl ?? "");
        setReplayUrl(first.replayUrl ?? "");
      }
    } catch {
      setError(t("loadError"));
    }
  }

  useEffect(() => {
    void loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const target = events.find((event) => event.id === selectedId);
    if (!target) return;
    setStatus(target.status);
    setWarmupUrl(target.warmupUrl ?? "");
    setLiveUrl(target.liveUrl ?? "");
    setReplayUrl(target.replayUrl ?? "");
  }, [selectedId, events]);

  async function createEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/live/events/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          title,
          status: createStatus,
          visibility,
          scheduledStartAt: scheduledStartAt ? new Date(scheduledStartAt).toISOString() : undefined,
          warmupUrl: warmupUrl || undefined,
          liveUrl: liveUrl || undefined,
          replayUrl: replayUrl || undefined,
        }),
      });
      const data = (await response.json().catch(() => null)) as { ok?: boolean; event?: LiveEvent; error?: string } | null;
      if (!response.ok || !data?.ok || !data.event) {
        setError(data?.error || t("createError"));
        return;
      }

      setNotice(t("createSuccess"));
      setEvents((prev) => [data.event!, ...prev]);
      setSelectedId(data.event.id);
      setTitle("");
      setSlug("");
      setScheduledStartAt("");
    } catch {
      setError(t("createError"));
    }
  }

  async function updateStatus() {
    if (!selectedId) return;
    setError("");
    setNotice("");

    try {
      const response = await fetch(`/api/live/events/${selectedId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = (await response.json().catch(() => null)) as { ok?: boolean; event?: LiveEvent; error?: string } | null;
      if (!response.ok || !data?.ok || !data.event) {
        setError(data?.error || t("updateStatusError"));
        return;
      }

      setNotice(t("updateStatusSuccess"));
      setEvents((prev) => prev.map((item) => (item.id === data.event!.id ? data.event! : item)));
    } catch {
      setError(t("updateStatusError"));
    }
  }

  async function updateLinks() {
    if (!selectedId) return;
    setError("");
    setNotice("");

    try {
      const response = await fetch(`/api/live/events/${selectedId}/links`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warmupUrl: warmupUrl || null,
          liveUrl: liveUrl || null,
          replayUrl: replayUrl || null,
        }),
      });
      const data = (await response.json().catch(() => null)) as { ok?: boolean; event?: LiveEvent; error?: string } | null;
      if (!response.ok || !data?.ok || !data.event) {
        setError(data?.error || t("updateLinksError"));
        return;
      }

      setNotice(t("updateLinksSuccess"));
      setEvents((prev) => prev.map((item) => (item.id === data.event!.id ? data.event! : item)));
    } catch {
      setError(t("updateLinksError"));
    }
  }

  async function loadRsvps() {
    if (!selectedId) return;
    setError("");
    setNotice("");

    try {
      const response = await fetch(`/api/live/events/${selectedId}/rsvps?limit=100&offset=0`, {
        cache: "no-store",
      });
      const data = (await response.json().catch(() => null)) as { ok?: boolean; rsvps?: RsvpRecord[]; error?: string } | null;
      if (!response.ok || !data?.ok) {
        setError(data?.error || t("rsvpLoadError"));
        return;
      }

      setRsvps(data.rsvps ?? []);
      setNotice(t("rsvpLoadSuccess"));
    } catch {
      setError(t("rsvpLoadError"));
    }
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-garden-950">{t("title")}</h1>
        <p className="text-sm text-garden-800">{t("lead")}</p>
      </header>

      {notice ? <p className="rounded-lg border border-garden-200 bg-garden-50 px-3 py-2 text-sm text-garden-800">{notice}</p> : null}
      {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}

      <section className="rounded-2xl border border-garden-200 bg-white px-6 py-6 shadow-sm">
        <h2 className="text-lg font-semibold text-garden-900">{t("createTitle")}</h2>
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={createEvent}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder={t("titlePlaceholder")} className="rounded-lg border border-garden-200 px-3 py-2 text-sm" />
          <input value={slug} onChange={(e) => setSlug(e.target.value)} required placeholder={t("slugPlaceholder")} className="rounded-lg border border-garden-200 px-3 py-2 text-sm" />
          <input type="datetime-local" value={scheduledStartAt} onChange={(e) => setScheduledStartAt(e.target.value)} className="rounded-lg border border-garden-200 px-3 py-2 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <select value={createStatus} onChange={(e) => setCreateStatus(e.target.value as "prelive" | "live" | "replay")} className="rounded-lg border border-garden-200 px-3 py-2 text-sm">
              <option value="prelive">prelive</option>
              <option value="live">live</option>
              <option value="replay">replay</option>
            </select>
            <select value={visibility} onChange={(e) => setVisibility(e.target.value as "published" | "draft")} className="rounded-lg border border-garden-200 px-3 py-2 text-sm">
              <option value="published">published</option>
              <option value="draft">draft</option>
            </select>
          </div>
          <input value={warmupUrl} onChange={(e) => setWarmupUrl(e.target.value)} placeholder={t("warmupPlaceholder")} className="sm:col-span-2 rounded-lg border border-garden-200 px-3 py-2 text-sm" />
          <input value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)} placeholder={t("livePlaceholder")} className="sm:col-span-2 rounded-lg border border-garden-200 px-3 py-2 text-sm" />
          <input value={replayUrl} onChange={(e) => setReplayUrl(e.target.value)} placeholder={t("replayPlaceholder")} className="sm:col-span-2 rounded-lg border border-garden-200 px-3 py-2 text-sm" />
          <button type="submit" className="sm:col-span-2 rounded-full bg-garden-600 px-5 py-2 text-sm font-semibold text-white hover:bg-garden-700">{t("createButton")}</button>
        </form>
      </section>

      <section className="rounded-2xl border border-garden-200 bg-white px-6 py-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-garden-900">{t("manageTitle")}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="rounded-lg border border-garden-200 px-3 py-2 text-sm">
            <option value="">{t("eventSelectPlaceholder")}</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>{event.title} ({event.status})</option>
            ))}
          </select>
          <button type="button" onClick={() => void loadEvents()} className="rounded-full border border-garden-300 px-4 py-2 text-sm font-semibold text-garden-800 hover:bg-garden-50">{t("refreshButton")}</button>

          <div className="flex gap-2">
            <select value={status} onChange={(e) => setStatus(e.target.value as "prelive" | "live" | "replay")} className="w-full rounded-lg border border-garden-200 px-3 py-2 text-sm">
              <option value="prelive">prelive</option>
              <option value="live">live</option>
              <option value="replay">replay</option>
            </select>
            <button type="button" onClick={() => void updateStatus()} disabled={!selectedId} className="rounded-full bg-garden-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{t("updateStatusButton")}</button>
          </div>

          <button type="button" onClick={() => void updateLinks()} disabled={!selectedId} className="rounded-full bg-garden-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{t("updateLinksButton")}</button>
          <button type="button" onClick={() => void loadRsvps()} disabled={!selectedId} className="rounded-full border border-garden-300 px-4 py-2 text-sm font-semibold text-garden-800 hover:bg-garden-50 disabled:opacity-60">{t("loadRsvpButton")}</button>

          <input value={warmupUrl} onChange={(e) => setWarmupUrl(e.target.value)} placeholder={t("warmupPlaceholder")} className="sm:col-span-2 rounded-lg border border-garden-200 px-3 py-2 text-sm" />
          <input value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)} placeholder={t("livePlaceholder")} className="sm:col-span-2 rounded-lg border border-garden-200 px-3 py-2 text-sm" />
          <input value={replayUrl} onChange={(e) => setReplayUrl(e.target.value)} placeholder={t("replayPlaceholder")} className="sm:col-span-2 rounded-lg border border-garden-200 px-3 py-2 text-sm" />
        </div>
      </section>

      <section className="rounded-2xl border border-garden-200 bg-white px-6 py-6 shadow-sm">
        <h2 className="text-lg font-semibold text-garden-900">{t("rsvpListTitle")}</h2>
        {rsvps.length === 0 ? (
          <p className="mt-3 text-sm text-garden-700">{t("rsvpEmpty")}</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-garden-600">
                <tr>
                  <th className="py-2">{t("rsvpName")}</th>
                  <th className="py-2">{t("rsvpEmail")}</th>
                  <th className="py-2">{t("rsvpStatus")}</th>
                  <th className="py-2">{t("rsvpTime")}</th>
                </tr>
              </thead>
              <tbody>
                {rsvps.map((row) => (
                  <tr key={row.id} className="border-t border-garden-100">
                    <td className="py-2">{row.fullName || "-"}</td>
                    <td className="py-2">{row.email}</td>
                    <td className="py-2">{row.status}</td>
                    <td className="py-2">{new Date(row.registeredAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
