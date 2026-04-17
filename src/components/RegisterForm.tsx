"use client";

import { FormEvent, useState } from "react";

type Props = {
  labelName: string;
  labelEmail: string;
  labelOrg: string;
  labelNotes: string;
  placeholderName: string;
  placeholderEmail: string;
  placeholderOrg: string;
  placeholderNotes: string;
  submit: string;
  reassurance: string;
  submitSuccess: string;
  submitError: string;
  submitMissingConfig: string;
  submitInFlight: string;
};

export function RegisterForm({
  labelName,
  labelEmail,
  labelOrg,
  labelNotes,
  placeholderName,
  placeholderEmail,
  placeholderOrg,
  placeholderNotes,
  submit,
  reassurance,
  submitSuccess,
  submitError,
  submitMissingConfig,
  submitInFlight,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setIsSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !data?.ok) {
        const message =
          data?.error === "Server is missing AIRTABLE_API_KEY / AIRTABLE_BASE_ID / AIRTABLE_TABLE_NAME environment variables."
            ? submitMissingConfig
            : data?.error || submitError;

        setStatus({ kind: "error", message });
        return;
      }

      form.reset();
      setStatus({ kind: "success", message: submitSuccess });
    } catch {
      setStatus({ kind: "error", message: submitError });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div>
        <label
          className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-garden-700"
          htmlFor="reg-name"
        >
          {labelName}
        </label>
        <input
          id="reg-name"
          name="name"
          type="text"
          autoComplete="name"
          className="w-full rounded-xl border border-garden-200 bg-garden-50/80 px-4 py-2.5 text-sm text-garden-900 outline-none ring-garden-500/30 placeholder:text-garden-400"
          placeholder={placeholderName}
        />
      </div>
      <div>
        <label
          className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-garden-700"
          htmlFor="reg-email"
        >
          {labelEmail}
        </label>
        <input
          id="reg-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-xl border border-garden-200 bg-garden-50/80 px-4 py-2.5 text-sm text-garden-900 outline-none"
          placeholder={placeholderEmail}
        />
      </div>
      <div>
        <label
          className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-garden-700"
          htmlFor="reg-org"
        >
          {labelOrg}
        </label>
        <input
          id="reg-org"
          name="org"
          type="text"
          autoComplete="organization"
          className="w-full rounded-xl border border-garden-200 bg-garden-50/80 px-4 py-2.5 text-sm text-garden-900 outline-none"
          placeholder={placeholderOrg}
        />
      </div>
      <div>
        <label
          className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-garden-700"
          htmlFor="reg-notes"
        >
          {labelNotes}
        </label>
        <textarea
          id="reg-notes"
          name="notes"
          rows={3}
          className="w-full resize-none rounded-xl border border-garden-200 bg-garden-50/80 px-4 py-2.5 text-sm text-garden-900 outline-none"
          placeholder={placeholderNotes}
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-garden-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-garden-700 sm:w-auto sm:px-8"
      >
        {isSubmitting ? submitInFlight : submit}
      </button>
      {status ? (
        <p className="text-xs leading-relaxed text-garden-600" role="status" aria-live="polite">
          {status.message}
        </p>
      ) : null}
      <p className="text-xs leading-relaxed text-garden-600">{reassurance}</p>
    </form>
  );
}
