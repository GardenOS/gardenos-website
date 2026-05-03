"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

type WhitelistResponse = {
  ok?: boolean;
  emails?: string[];
  error?: string;
};

export function WhitelistAdminPanel() {
  const t = useTranslations("dashboardWhitelist");
  const [emails, setEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [confirmingEmail, setConfirmingEmail] = useState<string | null>(null);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showNotice(message: string) {
    setNotice(message);
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = setTimeout(() => setNotice(""), 4000);
  }

  async function loadEmails() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/whitelist", { cache: "no-store" });
      const data = (await response.json().catch(() => null)) as WhitelistResponse | null;
      if (!response.ok || !data?.ok || !Array.isArray(data.emails)) {
        setError(data?.error || t("loadError"));
        return;
      }
      setEmails(data.emails);
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEmails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = newEmail.trim().toLowerCase();
    if (!email) return;

    setError("");
    setNotice("");
    setSaving(true);
    try {
      const response = await fetch("/api/admin/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json().catch(() => null)) as WhitelistResponse | null;
      if (!response.ok || !data?.ok || !Array.isArray(data.emails)) {
        setError(data?.error || t("addError"));
        return;
      }
      setEmails(data.emails);
      setNewEmail("");
      showNotice(t("addSuccess"));
    } catch {
      setError(t("addError"));
    } finally {
      setSaving(false);
    }
  }

  async function removeEmail(email: string) {
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/admin/whitelist`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json().catch(() => null)) as WhitelistResponse | null;
      if (!response.ok || !data?.ok || !Array.isArray(data.emails)) {
        setError(data?.error || t("removeError"));
        return;
      }
      setEmails(data.emails);
      showNotice(t("removeSuccess"));
    } catch {
      setError(t("removeError"));
    }
  }

  function startEdit(email: string) {
    setEditingEmail(email);
    setEditValue(email);
    setError("");
    setNotice("");
    setConfirmingEmail(null);
  }

  function cancelEdit() {
    setEditingEmail(null);
    setEditValue("");
  }

  async function saveEdit(oldEmail: string) {
    const newValue = editValue.trim().toLowerCase();
    if (!newValue || newValue === oldEmail) {
      cancelEdit();
      return;
    }
    setError("");
    setNotice("");
    try {
      // Add new email first
      const addRes = await fetch("/api/admin/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newValue }),
      });
      const addData = (await addRes.json().catch(() => null)) as WhitelistResponse | null;
      if (!addRes.ok || !addData?.ok) {
        setError(addData?.error || t("editError"));
        return;
      }

      // Then remove old email
      const delRes = await fetch(`/api/admin/whitelist`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: oldEmail }),
      });
      const delData = (await delRes.json().catch(() => null)) as WhitelistResponse | null;
      if (!delRes.ok || !delData?.ok || !Array.isArray(delData.emails)) {
        setError(delData?.error || t("editError"));
        return;
      }

      setEmails(delData.emails);
      showNotice(t("editSuccess"));
      cancelEdit();
    } catch {
      setError(t("editError"));
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-garden-950">{t("title")}</h1>
        <p className="text-sm text-garden-800">{t("lead")}</p>
      </header>

      {notice ? (
        <p
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800"
        >
          <span aria-hidden="true">✓</span>
          {notice}
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {error}
        </p>
      ) : null}

      <section className="rounded-2xl border border-garden-200 bg-white px-6 py-6 shadow-sm">
        <h2 className="text-lg font-semibold text-garden-900">{t("addTitle")}</h2>
        <form className="mt-4 flex flex-wrap gap-3" onSubmit={addEmail}>
          <input
            type="email"
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
            required
            placeholder={t("emailPlaceholder")}
            className="min-w-[280px] flex-1 rounded-lg border border-garden-200 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-garden-600 px-4 py-2 text-sm font-semibold text-white hover:bg-garden-700"
          >
            {saving ? t("saving") : t("addButton")}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-garden-200 bg-white px-6 py-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-garden-900">{t("listTitle")}</h2>
          <button
            type="button"
            onClick={() => void loadEmails()}
            className="rounded-full border border-garden-300 px-4 py-2 text-sm font-semibold text-garden-800 hover:bg-garden-50"
          >
            {t("refreshButton")}
          </button>
        </div>

        {loading ? <p className="text-sm text-garden-700">{t("loading")}</p> : null}

        {!loading && emails.length === 0 ? (
          <p className="text-sm text-garden-700">{t("empty")}</p>
        ) : null}

        {emails.length > 0 ? (
          <ul className="space-y-2">
            {emails.map((email) => (
              <li
                key={email}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-garden-200 px-3 py-2"
              >
                {editingEmail === email ? (
                  <>
                    <input
                      type="email"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="min-w-[220px] flex-1 rounded-lg border border-garden-300 px-3 py-1.5 text-sm"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void saveEdit(email)}
                        className="rounded-full bg-garden-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-garden-700"
                      >
                        {t("editSave")}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded-full border border-garden-300 px-3 py-1.5 text-xs font-semibold text-garden-700 hover:bg-garden-50"
                      >
                        {t("editCancel")}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-sm text-garden-900">{email}</span>
                    {confirmingEmail === email ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-red-700">{t("removeConfirm")}</span>
                        <button
                          type="button"
                          onClick={() => void removeEmail(email)}
                          className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                        >
                          {t("removeConfirmYes")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingEmail(null)}
                          className="rounded-full border border-garden-300 px-3 py-1.5 text-xs font-semibold text-garden-700 hover:bg-garden-50"
                        >
                          {t("editCancel")}
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(email)}
                          className="rounded-full border border-garden-300 px-3 py-1.5 text-xs font-semibold text-garden-700 hover:bg-garden-50"
                        >
                          {t("editButton")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingEmail(email)}
                          className="rounded-full border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                        >
                          {t("removeButton")}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

    </div>
  );
}
