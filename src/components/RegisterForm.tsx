"use client";

import { FormEvent, useState } from "react";

export type RegisterFormCopy = {
  labelName: string;
  labelEmail: string;
  labelOrg: string;
  labelOptionalContact: string;
  labelScenario: string;
  placeholderName: string;
  placeholderEmail: string;
  placeholderOrg: string;
  placeholderOptionalContact: string;
  placeholderScenario: string;
  submit: string;
  submitInFlight: string;
  successTitle: string;
  successBody: string;
  submitError: string;
  submitMissingConfig: string;
};

type Props = {
  locale: string;
  copy: RegisterFormCopy;
};

const inputClass =
  "w-full rounded-xl border border-garden-200 bg-garden-50/80 px-4 py-2.5 text-sm text-garden-900 outline-none ring-garden-500/30 placeholder:text-garden-400";

export function RegisterForm({ locale, copy }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("registerLocale", locale);

    setIsSubmitting(true);
    setErrorMessage(null);

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

        setErrorMessage(message);
        return;
      }

      form.reset();
      setSubmitted(true);
    } catch {
      setErrorMessage(copy.submitError);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div
        className="rounded-2xl border border-garden-300/80 bg-gradient-to-br from-garden-50 to-white px-6 py-8 shadow-sm sm:px-8 sm:py-10"
        role="status"
        aria-live="polite"
      >
        <h3 className="text-balance text-xl font-semibold tracking-tight text-garden-800 sm:text-2xl">
          {copy.successTitle}
        </h3>
        <p className="mt-4 max-w-lg text-pretty text-base leading-relaxed text-garden-700">
          {copy.successBody}
        </p>
      </div>
    );
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
          htmlFor="reg-optional-contact"
        >
          {copy.labelOptionalContact}
        </label>
        <input
          id="reg-optional-contact"
          name="optionalContact"
          type="text"
          autoComplete="off"
          className={inputClass}
          placeholder={copy.placeholderOptionalContact}
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
      {errorMessage ? (
        <p className="text-sm leading-relaxed text-red-700" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </form>
  );
}
