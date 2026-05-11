"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

const PAGE_SIZE = 20;

type LiveEvent = {
  id: string;
  title: string;
  titleEn: string | null;
  slug: string;
  status: "prelive" | "live" | "replay" | "ended";
  visibility: "draft" | "published" | "archived";
  scheduledStartAt: string | null;
};

// Unified user row for the per-event merged table
function getDisplayTitle(event: LiveEvent, locale: string): string {
  if (locale === "en") {
    return event.titleEn?.trim() || event.title;
  }
  return event.title;
}
type EventUser = {
  key: string;
  fullName: string;
  email: string;
  phone: string | null;
  region: string | null;
  submittedAt: string;
};

function mergeEventUsers(
  rsvps: Array<{ id: string; email: string; fullName: string | null; registeredAt: string }>,
  registrations: RegistrationRow[]
): EventUser[] {
  const map = new Map<string, EventUser>();
  for (const r of rsvps) {
    const key = r.email.toLowerCase();
    map.set(key, {
      key: `rsvp-${r.id}`,
      fullName: r.fullName ?? "",
      email: r.email,
      phone: null,
      region: null,
      submittedAt: r.registeredAt,
    });
  }
  for (const r of registrations) {
    const key = r.email.toLowerCase();
    map.set(key, {
      key: `reg-${r.id}`,
      fullName: r.fullName,
      email: r.email,
      phone: r.phone,
      region: r.region || null,
      submittedAt: r.submittedAt,
    });
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
}

type RegistrationRow = {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  region: string;
  wechatId: string | null;
  gardenFeatures: string[];
  notes: string | null;
  lang: string;
  submittedAt: string;
  liveEventId: string | null;
  isActive: boolean;
};

export function RsvpAdminPanel() {
  const t = useTranslations("dashboardRsvp");
  const locale = useLocale();

  // Events
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [eventError, setEventError] = useState("");

  // Per-event merged users
  const [eventUsers, setEventUsers] = useState<EventUser[]>([]);
  const [eventUsersLoaded, setEventUsersLoaded] = useState(false);
  const [eventUsersError, setEventUsersError] = useState("");
  // All registrations (auto-loaded, paginated)
  const [allRegistrations, setAllRegistrations] = useState<RegistrationRow[]>([]);
  const [allLoaded, setAllLoaded] = useState(false);
  const [allError, setAllError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [sendingInviteId, setSendingInviteId] = useState<number | null>(null);
  const [sendingAllInvites, setSendingAllInvites] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteInfo, setInviteInfo] = useState("");
  const [page, setPage] = useState(0);

  // Load events on mount, then auto-select nearest
  useEffect(() => {
    async function loadEvents() {
      setEventError("");
      try {
        const res = await fetch("/api/admin/live/events", { cache: "no-store" });
        const data = (await res.json().catch(() => null)) as {
          ok?: boolean;
          events?: LiveEvent[];
          error?: string;
        } | null;

        if (!res.ok || !data?.ok) {
          setEventError(data?.error || t("loadEventsError"));
          return;
        }

        const all = data.events ?? [];
        setEvents(all);

        const prelive = all.filter((e) => e.status === "prelive");
        const preliveWithoutSchedule = prelive.filter((e) => !e.scheduledStartAt);

        const upcoming =
          preliveWithoutSchedule.length > 0
            ? preliveWithoutSchedule
            : [...prelive].sort((a, b) => {
                const ta = a.scheduledStartAt ? new Date(a.scheduledStartAt).getTime() : Infinity;
                const tb = b.scheduledStartAt ? new Date(b.scheduledStartAt).getTime() : Infinity;
                return ta - tb;
              });

        const autoSelect = upcoming[0] ?? all[0];
        if (autoSelect) {
          setSelectedEventId(autoSelect.id);
        }
      } catch {
        setEventError(t("loadEventsError"));
      }
    }

    void loadEvents();
  }, [t]);

  // Auto-load event users whenever selected event changes
  useEffect(() => {
    if (!selectedEventId) return;
    void loadEventUsers(selectedEventId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId]);

  // Auto-load all registrations on mount
  useEffect(() => {
    void loadAllRegistrations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadEventUsers(eventId: string) {
    setEventUsersLoaded(false);
    setEventUsersError("");
    setEventUsers([]);

    try {
      const [rsvpRes, regRes] = await Promise.all([
        fetch(`/api/live/events/${eventId}/rsvps?limit=500&offset=0`, { cache: "no-store" }),
        fetch(`/api/admin/registrations?liveEventId=${eventId}&limit=500&offset=0`, { cache: "no-store" }),
      ]);

      const rsvpData = (await rsvpRes.json().catch(() => null)) as {
        ok?: boolean;
        rsvps?: Array<{ id: string; email: string; fullName: string | null; registeredAt: string }>;
        error?: string;
      } | null;

      const regData = (await regRes.json().catch(() => null)) as {
        ok?: boolean;
        registrations?: RegistrationRow[];
        error?: string;
      } | null;

      if ((!rsvpRes.ok || !rsvpData?.ok) && (!regRes.ok || !regData?.ok)) {
        setEventUsersError(t("loadEventUsersError"));
        return;
      }

      const merged = mergeEventUsers(rsvpData?.rsvps ?? [], regData?.registrations ?? []);
      setEventUsers(merged);
      setEventUsersLoaded(true);
    } catch {
      setEventUsersError(t("loadEventUsersError"));
    }
  }

  async function loadAllRegistrations() {
    setAllLoaded(false);
    setAllError("");
    setDeleteError("");
    try {
      const res = await fetch("/api/admin/registrations?limit=500&offset=0", { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        registrations?: RegistrationRow[];
        error?: string;
      } | null;

      if (!res.ok || !data?.ok) {
        setAllError(data?.error || t("registrationsLoadError"));
        return;
      }
      setAllRegistrations(data.registrations ?? []);
      setAllLoaded(true);
      setPage(0);
    } catch {
      setAllError(t("registrationsLoadError"));
    }
  }

  async function handleDeleteRegistration(row: RegistrationRow) {
    const confirmed = window.confirm(t("deleteConfirm", { email: row.email }));
    if (!confirmed) return;

    setDeleteError("");
    setDeletingId(row.id);

    try {
      const res = await fetch(`/api/admin/registrations/${row.id}`, { method: "DELETE" });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

      if (!res.ok || !data?.ok) {
        setDeleteError(data?.error || t("deleteError"));
        return;
      }

      setAllRegistrations((prev) => {
        const next = prev.filter((item) => item.id !== row.id);
        setPage((currentPage) => {
          const nextTotalPages = Math.max(1, Math.ceil(next.length / PAGE_SIZE));
          return Math.min(currentPage, nextTotalPages - 1);
        });
        return next;
      });
    } catch {
      setDeleteError(t("deleteError"));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSendInvite(row: RegistrationRow) {
    if (!selectedEventId) {
      setInviteError(t("inviteSelectEventFirst"));
      return;
    }

    setInviteError("");
    setInviteInfo("");
    setSendingInviteId(row.id);

    try {
      const sendInvite = async (force = false) => {
        const res = await fetch("/api/admin/live/invite-send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId: selectedEventId,
            email: row.email,
            lang: row.lang,
            force,
          }),
        });
        const data = (await res.json().catch(() => null)) as {
          ok?: boolean;
          error?: string;
          message?: string;
          alreadySent?: boolean;
          needsConfirm?: boolean;
        } | null;

        return { res, data };
      };

      let { res, data } = await sendInvite(false);

      if (res.status === 409 && data?.needsConfirm) {
        const confirmed = window.confirm(t("inviteDuplicateConfirm"));
        if (!confirmed) return;
        ({ res, data } = await sendInvite(true));
      }

      if (!res.ok || !data?.ok) {
        setInviteError(data?.error || t("inviteSendError"));
        return;
      }

      alert(t("inviteSendSuccess", { email: row.email }));
    } catch {
      setInviteError(t("inviteSendRuntimeError"));
    } finally {
      setSendingInviteId(null);
    }
  }

  async function handleSendInviteToAll() {
    if (!selectedEventId) {
      setInviteError(t("inviteSelectEventFirst"));
      return;
    }

    const confirmed = window.confirm(t("inviteAllConfirm"));
    if (!confirmed) return;

    setInviteError("");
    setInviteInfo("");
    setSendingAllInvites(true);

    try {
      const res = await fetch(`/api/live/events/${selectedEventId}/invite-rsvp`, {
        method: "POST",
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        candidateCount?: number;
        invitedCount?: number;
        skippedCount?: number;
        failedCount?: number;
      } | null;

      if (!res.ok || !data?.ok) {
        setInviteError(data?.error || t("inviteAllError"));
        return;
      }

      setInviteInfo(
        t("inviteAllSuccess", {
          invited: data.invitedCount ?? 0,
          candidate: data.candidateCount ?? 0,
          skipped: data.skippedCount ?? 0,
          failed: data.failedCount ?? 0,
        })
      );
    } catch {
      setInviteError(t("inviteAllRuntimeError"));
    } finally {
      setSendingAllInvites(false);
    }
  }

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const totalPages = Math.max(1, Math.ceil(allRegistrations.length / PAGE_SIZE));
  const pagedRows = allRegistrations.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-garden-950">{t("title")}</h1>
        <p className="text-sm text-garden-800">{t("lead")}</p>
      </header>

      {/* Event selector */}
      <section className="rounded-2xl border border-garden-200 bg-white px-6 py-6 shadow-sm">
        <p className="mb-3 text-sm font-medium text-garden-800">{t("eventSelectLabel")}</p>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="min-w-[260px] flex-1 rounded-lg border border-garden-200 px-3 py-2 text-sm"
          >
            <option value="">{t("eventSelectPlaceholder")}</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {getDisplayTitle(event, locale)} — {event.status}
                {event.scheduledStartAt ? ` (${new Date(event.scheduledStartAt).toLocaleDateString()})` : ""}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => selectedEventId && void loadEventUsers(selectedEventId)}
            disabled={!selectedEventId}
            className="rounded-full border border-garden-300 px-4 py-2 text-sm font-semibold text-garden-800 hover:bg-garden-50 disabled:opacity-50"
          >
            {t("refreshButton")}
          </button>
        </div>
        {eventError ? (
          <p className="mt-2 text-sm text-red-700">{eventError}</p>
        ) : null}
      </section>

      {/* Per-event merged users */}
      {eventUsersLoaded || eventUsersError ? (
        <section className="rounded-2xl border border-garden-200 bg-white px-6 py-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-garden-900">{selectedEvent ? getDisplayTitle(selectedEvent, locale) : ""}</h2>
              <p className="text-xs text-garden-600">{t("total", { count: eventUsers.length })}</p>
            </div>
          </div>

          {eventUsersError ? (
            <p className="text-sm text-red-700">{eventUsersError}</p>
          ) : eventUsers.length === 0 ? (
            <p className="text-sm text-garden-700">{t("empty")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-garden-600">
                  <tr>
                    <th className="py-2 pr-4">{t("colName")}</th>
                    <th className="py-2 pr-4">{t("colEmail")}</th>
                    <th className="py-2 pr-4">{t("colPhone")}</th>
                    <th className="py-2 pr-4">{t("colRegion")}</th>
                    <th className="py-2">{t("colSubmittedAt")}</th>
                  </tr>
                </thead>
                <tbody>
                  {eventUsers.map((row) => (
                    <tr key={row.key} className="border-t border-garden-100">
                      <td className="py-2 pr-4">{row.fullName || "—"}</td>
                      <td className="py-2 pr-4">{row.email}</td>
                      <td className="py-2 pr-4">{row.phone || "—"}</td>
                      <td className="py-2 pr-4">{row.region || "—"}</td>
                      <td className="py-2 text-garden-600">{new Date(row.submittedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {/* All registrations — auto-loaded, paginated */}
      <section className="rounded-2xl border border-garden-200 bg-white px-6 py-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-garden-900">{t("registrationsTitle")}</h2>
            <p className="text-xs text-garden-600">{t("registrationsLead")}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleSendInviteToAll()}
              disabled={!selectedEventId || sendingAllInvites}
              className="rounded-full border border-garden-300 px-4 py-2 text-sm font-semibold text-garden-800 hover:bg-garden-50 disabled:opacity-50"
            >
              {sendingAllInvites ? t("inviteAllSending") : t("inviteAllButton")}
            </button>
            <button
              type="button"
              onClick={() => void loadAllRegistrations()}
              className="rounded-full border border-garden-300 px-4 py-2 text-sm font-semibold text-garden-800 hover:bg-garden-50"
            >
              {t("refreshButton")}
            </button>
          </div>
        </div>

        {allError ? (
          <p className="text-sm text-red-700">{allError}</p>
        ) : !allLoaded ? (
          <p className="text-sm text-garden-600">加载中…</p>
        ) : allRegistrations.length === 0 ? (
          <p className="text-sm text-garden-700">{t("registrationsEmpty")}</p>
        ) : (
          <>
            <p className="mb-3 text-xs text-garden-600">
              {t("registrationsTotal", { count: allRegistrations.length })}
            </p>
            {deleteError ? <p className="mb-3 text-sm text-red-700">{deleteError}</p> : null}
            {inviteError ? <p className="mb-3 text-sm text-red-700">{inviteError}</p> : null}
            {inviteInfo ? <p className="mb-3 text-sm text-green-700">{inviteInfo}</p> : null}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-garden-600">
                  <tr>
                    <th className="py-2 pr-4">{t("colName")}</th>
                    <th className="py-2 pr-4">{t("colEmail")}</th>
                    <th className="py-2 pr-4">{t("colPhone")}</th>
                    <th className="py-2 pr-4">{t("colRegion")}</th>
                    <th className="py-2 pr-4">{t("colSubmittedAt")}</th>
                    <th className="py-2 pr-4">状态</th>
                    <th className="py-2">{t("colActions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedRows.map((row) => (
                    <tr key={row.id} className={`border-t border-garden-100 ${row.isActive ? "" : "opacity-50"}`}>
                      <td className="py-2 pr-4">{row.fullName || "—"}</td>
                      <td className="py-2 pr-4">{row.email}</td>
                      <td className="py-2 pr-4">{row.phone || "—"}</td>
                      <td className="py-2 pr-4">{row.region || "—"}</td>
                      <td className="py-2 pr-4 text-garden-600">{new Date(row.submittedAt).toLocaleString()}</td>
                      <td className="py-2 pr-4">
                        {row.isActive ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">生效</span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">已弃用</span>
                        )}
                      </td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void handleSendInvite(row)}
                            disabled={sendingInviteId === row.id || !selectedEventId}
                            className="rounded-md border border-garden-300 px-3 py-1.5 text-xs font-semibold text-garden-700 hover:bg-garden-50 disabled:opacity-50"
                          >
                            {sendingInviteId === row.id ? t("inviteSending") : t("inviteSendButton")}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteRegistration(row)}
                            disabled={deletingId === row.id}
                            className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                          >
                            {deletingId === row.id ? t("deleting") : t("deleteButton")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {totalPages > 1 ? (
                <div className="mt-4 flex items-center gap-3 text-sm">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page <= 0}
                    className="rounded-lg border border-garden-200 px-3 py-1.5 text-garden-700 hover:bg-garden-50 disabled:opacity-40"
                  >
                    {t("prevPage")}
                  </button>
                  <span className="text-garden-600">
                    {t("pageInfo", { page: page + 1, total: totalPages })}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="rounded-lg border border-garden-200 px-3 py-1.5 text-garden-700 hover:bg-garden-50 disabled:opacity-40"
                  >
                    {t("nextPage")}
                  </button>
                </div>
              ) : null}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
