"use client";

import { FormEvent, useState } from "react";

type Props = {
  defaultLanguage: string;
  labelFullName: string;
  labelWeChatId: string;
  labelPhone: string;
  labelEmail: string;
  labelPreferredContact: string;
  labelLanguage: string;
  labelSubscriptionPlan: string;
  placeholderFullName: string;
  placeholderWeChatId: string;
  placeholderPhone: string;
  placeholderEmail: string;
  placeholderPreferredContact: string;
  placeholderSubscriptionPlan: string;
  languageOptionEnglish: string;
  languageOptionChinese: string;
  submit: string;
  reassurance: string;
  submitSuccess: string;
  submitError: string;
  submitMissingConfig: string;
  submitInFlight: string;
};

export function RegisterForm({
  defaultLanguage,
  labelFullName,
  labelWeChatId,
  labelPhone,
  labelEmail,
  labelPreferredContact,
  labelLanguage,
  labelSubscriptionPlan,
  placeholderFullName,
  placeholderWeChatId,
  placeholderPhone,
  placeholderEmail,
  placeholderPreferredContact,
  placeholderSubscriptionPlan,
  languageOptionEnglish,
  languageOptionChinese,
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
      const languageSelect = form.querySelector<HTMLSelectElement>("#reg-language");
      if (languageSelect) languageSelect.value = defaultLanguage;
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
          htmlFor="reg-full-name"
        >
          {labelFullName}
        </label>
        <input
          id="reg-full-name"
          name="fullName"
          type="text"
          autoComplete="name"
          className="w-full rounded-xl border border-garden-200 bg-garden-50/80 px-4 py-2.5 text-sm text-garden-900 outline-none ring-garden-500/30 placeholder:text-garden-400"
          placeholder={placeholderFullName}
        />
      </div>
      <div>
        <label
          className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-garden-700"
          htmlFor="reg-wechat"
        >
          {labelWeChatId}
        </label>
        <input
          id="reg-wechat"
          name="wechatId"
          type="text"
          autoComplete="off"
          className="w-full rounded-xl border border-garden-200 bg-garden-50/80 px-4 py-2.5 text-sm text-garden-900 outline-none"
          placeholder={placeholderWeChatId}
        />
      </div>
      <div>
        <label
          className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-garden-700"
          htmlFor="reg-phone"
        >
          {labelPhone}
        </label>
        <input
          id="reg-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          className="w-full rounded-xl border border-garden-200 bg-garden-50/80 px-4 py-2.5 text-sm text-garden-900 outline-none"
          placeholder={placeholderPhone}
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
          htmlFor="reg-preferred-contact"
        >
          {labelPreferredContact}
        </label>
        <input
          id="reg-preferred-contact"
          name="preferredContact"
          type="text"
          className="w-full rounded-xl border border-garden-200 bg-garden-50/80 px-4 py-2.5 text-sm text-garden-900 outline-none"
          placeholder={placeholderPreferredContact}
        />
      </div>
      <div>
        <label
          className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-garden-700"
          htmlFor="reg-language"
        >
          {labelLanguage}
        </label>
        <select
          id="reg-language"
          name="language"
          required
          defaultValue={defaultLanguage}
          className="w-full rounded-xl border border-garden-200 bg-garden-50/80 px-4 py-2.5 text-sm text-garden-900 outline-none"
        >
          <option value="English">{languageOptionEnglish}</option>
          <option value="中文">{languageOptionChinese}</option>
        </select>
      </div>
      <div>
        <label
          className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-garden-700"
          htmlFor="reg-subscription-plan"
        >
          {labelSubscriptionPlan}
        </label>
        <input
          id="reg-subscription-plan"
          name="subscriptionPlan"
          type="text"
          className="w-full rounded-xl border border-garden-200 bg-garden-50/80 px-4 py-2.5 text-sm text-garden-900 outline-none"
          placeholder={placeholderSubscriptionPlan}
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
