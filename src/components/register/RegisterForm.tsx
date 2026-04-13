"use client";

import { useState } from "react";

interface Props {
  labels: {
    formTitle: string;
    formHint: string;
    labelName: string;
    labelEmail: string;
    labelOrg: string;
    labelNotes: string;
    submitLabel: string;
    privacy: string;
    successMsg: string;
    errorMsg: string;
  };
}

export function RegisterForm({ labels }: Props) {
  const [form, setForm] = useState({ name: "", email: "", org: "", notes: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );

  async function handleSubmit() {
    if (!form.name || !form.email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          organization: form.org,
          notes: form.notes
        })
      });
      if (res.ok) {
        setStatus("success");
        setForm({ name: "", email: "", org: "", notes: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-garden-200 bg-white p-6 shadow-sm sm:p-8 lg:col-span-3">
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-garden-100 text-2xl">
            🌱
          </div>
          <h2 className="text-lg font-semibold text-garden-950">
            {labels.successMsg}
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-garden-200 bg-white p-6 shadow-sm sm:p-8 lg:col-span-3">
      <h2 className="text-lg font-semibold text-garden-950">
        {labels.formTitle}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-garden-700">
        {labels.formHint}
      </p>
      <div className="mt-8 space-y-5">
        <div>
          <label
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-garden-700"
            htmlFor="reg-name"
          >
            {labels.labelName}
          </label>
          <input
            id="reg-name"
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded-xl border border-garden-200 bg-white px-4 py-2.5 text-sm text-garden-900 outline-none ring-garden-500/30 placeholder:text-garden-400 focus:border-garden-400 focus:ring-2"
            placeholder="您的姓名或昵称"
          />
        </div>
        <div>
          <label
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-garden-700"
            htmlFor="reg-email"
          >
            {labels.labelEmail}
          </label>
          <input
            id="reg-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full rounded-xl border border-garden-200 bg-white px-4 py-2.5 text-sm text-garden-900 outline-none focus:border-garden-400 focus:ring-2 focus:ring-garden-500/30"
            placeholder="your@email.com"
          />
        </div>
        <div>
          <label
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-garden-700"
            htmlFor="reg-org"
          >
            {labels.labelOrg}
          </label>
          <input
            id="reg-org"
            type="text"
            value={form.org}
            onChange={(e) => setForm((f) => ({ ...f, org: e.target.value }))}
            className="w-full rounded-xl border border-garden-200 bg-white px-4 py-2.5 text-sm text-garden-900 outline-none focus:border-garden-400 focus:ring-2 focus:ring-garden-500/30"
            placeholder="—"
          />
        </div>
        <div>
          <label
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-garden-700"
            htmlFor="reg-notes"
          >
            {labels.labelNotes}
          </label>
          <textarea
            id="reg-notes"
            rows={3}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="w-full resize-none rounded-xl border border-garden-200 bg-white px-4 py-2.5 text-sm text-garden-900 outline-none focus:border-garden-400 focus:ring-2 focus:ring-garden-500/30"
            placeholder="—"
          />
        </div>
        {status === "error" && <p className="text-sm text-red-600">{labels.errorMsg}</p>}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={status === "loading" || !form.name || !form.email}
          className="w-full rounded-full bg-garden-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-garden-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8"
        >
          {status === "loading" ? "提交中…" : labels.submitLabel}
        </button>
        <p className="text-xs leading-relaxed text-garden-600">{labels.privacy}</p>
      </div>
    </div>
  );
}

