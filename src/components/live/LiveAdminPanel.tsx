"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

type LiveEvent = {
  id: string;
  title: string;
  slug: string;
  status: "prelive" | "live" | "replay";
  visibility: "draft" | "published" | "archived";
  scheduledStartAt: string | null;
  promoVideoUrl: string | null;
  posterUrl: string | null;
  warmupUrl: string | null;
  liveUrl: string | null;
  replayUrl: string | null;
};

export function LiveAdminPanel() {
  const t = useTranslations("dashboardLive");

  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  // Create form state
  const [createTitle, setCreateTitle] = useState("");
  const [createSlug, setCreateSlug] = useState("");
  const [createScheduledAt, setCreateScheduledAt] = useState("");
  const [createStatus, setCreateStatus] = useState<"prelive" | "live" | "replay">("prelive");
  const [createVisibility, setCreateVisibility] = useState<"published" | "draft">("published");
  const [createPromoVideoUrl, setCreatePromoVideoUrl] = useState("");
  const [createPosterUrl, setCreatePosterUrl] = useState("");
  const [createWarmupUrl, setCreateWarmupUrl] = useState("");
  const [createLiveUrl, setCreateLiveUrl] = useState("");
  const [createReplayUrl, setCreateReplayUrl] = useState("");
  const [createPosterUploading, setCreatePosterUploading] = useState(false);
  const createPosterInputRef = useRef<HTMLInputElement>(null);

  // Edit form state (synced from selectedId)
  const [editStatus, setEditStatus] = useState<"prelive" | "live" | "replay">("prelive");
  const [editPromoVideoUrl, setEditPromoVideoUrl] = useState("");
  const [editPosterUrl, setEditPosterUrl] = useState("");
  const [editWarmupUrl, setEditWarmupUrl] = useState("");
  const [editLiveUrl, setEditLiveUrl] = useState("");
  const [editReplayUrl, setEditReplayUrl] = useState("");
  const [editPosterUploading, setEditPosterUploading] = useState(false);
  const editPosterInputRef = useRef<HTMLInputElement>(null);

  async function loadEvents() {
    setError("");
    try {
      const response = await fetch("/api/live/events", { cache: "no-store" });
      const data = (await response.json()) as { ok?: boolean; events?: LiveEvent[]; error?: string };
      if (!response.ok || !data.ok) {
        setError(data.error || t("loadError"));
        return;
      }
      setEvents(data.events ?? []);
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
    setEditStatus(target.status);
    setEditPromoVideoUrl(target.promoVideoUrl ?? "");
    setEditPosterUrl(target.posterUrl ?? "");
    setEditWarmupUrl(target.warmupUrl ?? "");
    setEditLiveUrl(target.liveUrl ?? "");
    setEditReplayUrl(target.replayUrl ?? "");
  }, [selectedId, events]);

  async function createEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!createPromoVideoUrl.trim() && !createPosterUrl.trim()) {
      setError(t("promoAtLeastOne"));
      return;
    }

    try {
      const response = await fetch("/api/live/events/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: createSlug,
          title: createTitle,
          status: createStatus,
          visibility: createVisibility,
          scheduledStartAt: createScheduledAt ? new Date(createScheduledAt).toISOString() : undefined,
          promoVideoUrl: createPromoVideoUrl || undefined,
          posterUrl: createPosterUrl || undefined,
          warmupUrl: createWarmupUrl || undefined,
          liveUrl: createLiveUrl || undefined,
          replayUrl: createReplayUrl || undefined,
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
      setCreateTitle("");
      setCreateSlug("");
      setCreateScheduledAt("");
      setCreatePromoVideoUrl("");
      setCreatePosterUrl("");
      setCreateWarmupUrl("");
      setCreateLiveUrl("");
      setCreateReplayUrl("");
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
        body: JSON.stringify({ status: editStatus }),
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
          promoVideoUrl: editPromoVideoUrl || null,
          posterUrl: editPosterUrl || null,
          warmupUrl: editWarmupUrl || null,
          liveUrl: editLiveUrl || null,
          replayUrl: editReplayUrl || null,
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

  async function uploadPoster(
    file: File,
    setUrl: (url: string) => void,
    setUploading: (v: boolean) => void
  ) {
    setUploading(true);
    setError("");
    try {
      const metaRes = await fetch("/api/admin/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      const meta = (await metaRes.json()) as { uploadUrl?: string; publicUrl?: string; error?: string };
      if (!metaRes.ok || !meta.uploadUrl || !meta.publicUrl) {
        setError(meta.error || t("posterUploadError"));
        return;
      }
      const uploadRes = await fetch(meta.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) {
        setError(t("posterUploadError"));
        return;
      }
      setUrl(meta.publicUrl);
    } catch {
      setError(t("posterUploadError"));
    } finally {
      setUploading(false);
    }
  }

  const selectedEvent = events.find((e) => e.id === selectedId);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-garden-950">{t("title")}</h1>
        <p className="text-sm text-garden-800">{t("lead")}</p>
      </header>

      {notice ? <p className="rounded-lg border border-garden-200 bg-garden-50 px-3 py-2 text-sm text-garden-800">{notice}</p> : null}
      {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}

      {/* Create new event */}
      <section className="rounded-2xl border border-garden-200 bg-white px-6 py-6 shadow-sm">
        <h2 className="text-lg font-semibold text-garden-900">{t("createTitle")}</h2>
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={createEvent}>
          <input value={createTitle} onChange={(e) => setCreateTitle(e.target.value)} required placeholder={t("titlePlaceholder")} className="rounded-lg border border-garden-200 px-3 py-2 text-sm" />
          <input value={createSlug} onChange={(e) => setCreateSlug(e.target.value)} required placeholder={t("slugPlaceholder")} className="rounded-lg border border-garden-200 px-3 py-2 text-sm" />
          <input type="datetime-local" value={createScheduledAt} onChange={(e) => setCreateScheduledAt(e.target.value)} className="rounded-lg border border-garden-200 px-3 py-2 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <select value={createStatus} onChange={(e) => setCreateStatus(e.target.value as "prelive" | "live" | "replay")} className="rounded-lg border border-garden-200 px-3 py-2 text-sm">
              <option value="prelive">prelive</option>
              <option value="live">live</option>
              <option value="replay">replay</option>
            </select>
            <select value={createVisibility} onChange={(e) => setCreateVisibility(e.target.value as "published" | "draft")} className="rounded-lg border border-garden-200 px-3 py-2 text-sm">
              <option value="published">published</option>
              <option value="draft">draft</option>
            </select>
          </div>
          {/* Promo video URL */}
          <input value={createPromoVideoUrl} onChange={(e) => setCreatePromoVideoUrl(e.target.value)} placeholder={t("promoVideoPlaceholder")} className="sm:col-span-2 rounded-lg border border-garden-200 px-3 py-2 text-sm" />
          {/* Poster URL + upload */}
          <div className="sm:col-span-2 space-y-2">
            <div className="flex gap-2">
              <input
                value={createPosterUrl}
                onChange={(e) => setCreatePosterUrl(e.target.value)}
                placeholder={t("posterUrlPlaceholder")}
                className="flex-1 rounded-lg border border-garden-200 px-3 py-2 text-sm"
              />
              <button
                type="button"
                disabled={createPosterUploading}
                onClick={() => createPosterInputRef.current?.click()}
                className="rounded-lg border border-garden-300 px-3 py-2 text-xs font-semibold text-garden-700 hover:bg-garden-50 disabled:opacity-50"
              >
                {createPosterUploading ? t("posterUploading") : t("posterUploadButton")}
              </button>
              <input
                ref={createPosterInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadPoster(file, setCreatePosterUrl, setCreatePosterUploading);
                  e.target.value = "";
                }}
              />
            </div>
            {createPosterUrl ? (
              <img src={createPosterUrl} alt="poster preview" className="h-24 rounded-lg border border-garden-200 object-cover" />
            ) : null}
          </div>
          <input value={createWarmupUrl} onChange={(e) => setCreateWarmupUrl(e.target.value)} placeholder={t("warmupPlaceholder")} className="sm:col-span-2 rounded-lg border border-garden-200 px-3 py-2 text-sm" />
          <input value={createLiveUrl} onChange={(e) => setCreateLiveUrl(e.target.value)} placeholder={t("livePlaceholder")} className="sm:col-span-2 rounded-lg border border-garden-200 px-3 py-2 text-sm" />
          <input value={createReplayUrl} onChange={(e) => setCreateReplayUrl(e.target.value)} placeholder={t("replayPlaceholder")} className="sm:col-span-2 rounded-lg border border-garden-200 px-3 py-2 text-sm" />
          <p className="sm:col-span-2 text-xs text-garden-600">{t("promoAtLeastOneHint")}</p>
          <button type="submit" className="sm:col-span-2 rounded-full bg-garden-600 px-5 py-2 text-sm font-semibold text-white hover:bg-garden-700">{t("createButton")}</button>
        </form>
      </section>

      {/* Event history table */}
      <section className="rounded-2xl border border-garden-200 bg-white px-6 py-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-garden-900">{t("historyTitle")}</h2>
          <button type="button" onClick={() => void loadEvents()} className="rounded-full border border-garden-300 px-4 py-2 text-sm font-semibold text-garden-800 hover:bg-garden-50">{t("refreshButton")}</button>
        </div>

        {events.length === 0 ? (
          <p className="text-sm text-garden-700">{t("noEvents")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-garden-600">
                <tr>
                  <th className="py-2 pr-4">{t("colTitle")}</th>
                  <th className="py-2 pr-4">{t("colStatus")}</th>
                  <th className="py-2 pr-4">{t("colVisibility")}</th>
                  <th className="py-2 pr-4">{t("colScheduled")}</th>
                  <th className="py-2">{t("colActions")}</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr
                    key={event.id}
                    className={`border-t border-garden-100 ${selectedId === event.id ? "bg-garden-50" : ""}`}
                  >
                    <td className="py-2 pr-4 font-medium text-garden-900">{event.title}</td>
                    <td className="py-2 pr-4">
                      <span className="rounded-full bg-garden-100 px-2 py-0.5 text-xs font-medium text-garden-800">
                        {event.status}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-garden-700">{event.visibility}</td>
                    <td className="py-2 pr-4 text-garden-600">
                      {event.scheduledStartAt
                        ? new Date(event.scheduledStartAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() => setSelectedId(selectedId === event.id ? "" : event.id)}
                        className="rounded-full border border-garden-300 px-3 py-1 text-xs font-semibold text-garden-700 hover:bg-garden-100"
                      >
                        {selectedId === event.id ? t("colActionsClose") : t("editButton")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Edit selected event */}
      {selectedEvent ? (
        <section className="rounded-2xl border border-garden-200 bg-white px-6 py-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-garden-900">
            {t("manageTitle")} — <span className="text-garden-600">{selectedEvent.title}</span>
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex gap-2">
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as "prelive" | "live" | "replay")}
                className="w-full rounded-lg border border-garden-200 px-3 py-2 text-sm"
              >
                <option value="prelive">prelive</option>
                <option value="live">live</option>
                <option value="replay">replay</option>
              </select>
              <button type="button" onClick={() => void updateStatus()} className="rounded-full bg-garden-700 px-4 py-2 text-sm font-semibold text-white">{t("updateStatusButton")}</button>
            </div>
            <button type="button" onClick={() => void updateLinks()} className="rounded-full bg-garden-600 px-4 py-2 text-sm font-semibold text-white">{t("updateLinksButton")}</button>
            {/* Promo video URL */}
            <input value={editPromoVideoUrl} onChange={(e) => setEditPromoVideoUrl(e.target.value)} placeholder={t("promoVideoPlaceholder")} className="sm:col-span-2 rounded-lg border border-garden-200 px-3 py-2 text-sm" />
            {/* Poster URL + upload */}
            <div className="sm:col-span-2 space-y-2">
              <div className="flex gap-2">
                <input
                  value={editPosterUrl}
                  onChange={(e) => setEditPosterUrl(e.target.value)}
                  placeholder={t("posterUrlPlaceholder")}
                  className="flex-1 rounded-lg border border-garden-200 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  disabled={editPosterUploading}
                  onClick={() => editPosterInputRef.current?.click()}
                  className="rounded-lg border border-garden-300 px-3 py-2 text-xs font-semibold text-garden-700 hover:bg-garden-50 disabled:opacity-50"
                >
                  {editPosterUploading ? t("posterUploading") : t("posterUploadButton")}
                </button>
                <input
                  ref={editPosterInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadPoster(file, setEditPosterUrl, setEditPosterUploading);
                    e.target.value = "";
                  }}
                />
              </div>
              {editPosterUrl ? (
                <img src={editPosterUrl} alt="poster preview" className="h-24 rounded-lg border border-garden-200 object-cover" />
              ) : null}
            </div>
            <input value={editWarmupUrl} onChange={(e) => setEditWarmupUrl(e.target.value)} placeholder={t("warmupPlaceholder")} className="sm:col-span-2 rounded-lg border border-garden-200 px-3 py-2 text-sm" />
            <input value={editLiveUrl} onChange={(e) => setEditLiveUrl(e.target.value)} placeholder={t("livePlaceholder")} className="sm:col-span-2 rounded-lg border border-garden-200 px-3 py-2 text-sm" />
            <input value={editReplayUrl} onChange={(e) => setEditReplayUrl(e.target.value)} placeholder={t("replayPlaceholder")} className="sm:col-span-2 rounded-lg border border-garden-200 px-3 py-2 text-sm" />
          </div>
        </section>
      ) : null}
    </div>
  );
}
