"use client";

import { FormEvent, useState } from "react";

export type RegisterFormCopy = {
  labelName: string;
  labelEmail: string;
  labelOrg: string;
  labelScenario: string;
  placeholderName: string;
  placeholderEmail: string;
  placeholderOrg: string;
  placeholderScenario: string;
  submit: string;
  submitInFlight: string;
  submitSuccess: string;
  submitError: string;
  submitMissingConfig: string;
};

type Props = {
  copy: RegisterFormCopy;
};

const inputClass =
  "w-full rounded-xl border border-garden-200 bg-garden-50/80 px-4 py-2.5 text-sm text-garden-900 outline-none ring-garden-500/30 placeholder:text-garden-400";

export function RegisterForm({ copy }: Props) {
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
          data?.error ===
          "Server is missing AIRTABLE_API_KEY / AIRTABLE_BASE_ID / AIRTABLE_TABLE_NAME environment variables."
            ? copy.submitMissingConfig
            : data?.error || copy.submitError;

        setStatus({ kind: "error", message });
        return;
      }

      form.reset();
      setStatus({ kind: "success", message: copy.submitSuccess });
    } catch {
      setStatus({ kind: "error", message: copy.submitError });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label
          className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-garden-700"
          htmlFor="reg-name"
        >
          {copy.labelName}
        </label>
        <input
          id="reg-name"
          name="fullName"
          type="text"
          autoComplete="nickname"
          className={inputClass}
          placeholder={copy.placeholderName}
        />
      </div>
      <div>
        <label
          className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-garden-700"
          htmlFor="reg-email"
        >
          {copy.labelEmail}
        </label>
        <input
          id="reg-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputClass}
          placeholder={copy.placeholderEmail}
        />
      </div>
      <div>
        <label
          className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-garden-700"
          htmlFor="reg-org"
        >
          {copy.labelOrg}
        </label>
        <input
          id="reg-org"
          name="organization"
          type="text"
          autoComplete="organization"
          className={inputClass}
          placeholder={copy.placeholderOrg}
        />
      </div>
      <div>
        <label
          className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-garden-700"
          htmlFor="reg-scenario"
        >
          {copy.labelScenario}
        </label>
        <textarea
          id="reg-scenario"
          name="scenarioNeeds"
          rows={4}
          className={`${inputClass} resize-y`}
          placeholder={copy.placeholderScenario}
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-garden-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-garden-700 disabled:opacity-70 sm:w-auto sm:px-8"
      >
        {isSubmitting ? copy.submitInFlight : copy.submit}
      </button>
      {status ? (
        <p
          className={
            status.kind === "success"
              ? "text-sm font-medium text-garden-800"
              : "text-sm text-red-700"
          }
          role="status"
          aria-live="polite"
        >
          {status.message}
        </p>
      ) : null}
    </form>
  );
}
