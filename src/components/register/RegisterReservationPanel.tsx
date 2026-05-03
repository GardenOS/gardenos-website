"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";

type RegisterResponse = {
  ok: boolean;
  error?: string;
};

function getPreferredLocale(): "zh" | "en" {
  if (typeof document === "undefined") return "en";
  return document.documentElement.lang?.startsWith("zh") ? "zh" : "en";
}

const inputClass =
  "mt-1 w-full rounded-xl border border-garden-200 bg-garden-50/80 px-4 py-2.5 text-sm text-garden-900 outline-none ring-garden-500/30 placeholder:text-garden-400";

const regions = [
  "East Auckland",
  "North Shore",
  "Central",
  "West",
  "South Auckland",
  "Other",
] as const;

export function RegisterReservationPanel() {
  const t = useTranslations("register");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("");
  const [wechat, setWechat] = useState("");
  const [gardenFeatures, setGardenFeatures] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const otherLabel = t("features.other");
  const featureOptions = [
    t("features.slope"),
    t("features.trees"),
    t("features.narrow"),
    t("features.large"),
    t("features.boundaries"),
    t("features.justLooking"),
  ];
  const otherChecked = gardenFeatures.includes(otherLabel);

  function toggleFeature(feature: string) {
    setGardenFeatures((current) =>
      current.includes(feature)
        ? current.filter((item) => item !== feature)
        : [...current, feature]
    );
  }

  async function submitRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!name.trim() || !email.trim() || !region.trim()) {
      setErrorMessage(t("submitValidationError"));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          region,
          wechat: wechat.trim(),
          gardenFeatures,
          notes: notes.trim(),
          timestamp: new Date().toISOString(),
          lang: getPreferredLocale(),
        }),
      });

      const data = (await response.json().catch(() => null)) as RegisterResponse | null;
      if (!response.ok || !data?.ok) {
        setErrorMessage(data?.error || t("submitError"));
        return;
      }

      setSubmitted(true);
      setName("");
      setEmail("");
      setPhone("");
      setRegion("");
      setWechat("");
      setGardenFeatures([]);
      setNotes("");
    } catch {
      setErrorMessage(t("submitError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div
        className="rounded-[1.75rem] border border-garden-300/80 bg-gradient-to-br from-garden-50 to-white px-6 py-8 shadow-sm"
        role="status"
        aria-live="polite"
      >
        <h3 className="text-balance text-xl font-semibold tracking-tight text-garden-800 sm:text-2xl">
          {t("successTitle")}
        </h3>
        <p className="mt-4 max-w-lg text-pretty text-base leading-relaxed text-garden-700">
          {t("successBody")}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submitRegistration}
      className="rounded-[1.75rem] border border-garden-200 bg-white px-5 py-5 shadow-lg sm:px-6 sm:py-6"
    >
      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-garden-950">{t("formTitle")}</h2>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-garden-700" htmlFor="reg-name">
            {t("labelName")}
          </label>
          <input
            id="reg-name"
            type="text"
            required
            autoComplete="nickname"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={inputClass}
            placeholder={t("placeholderName")}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-garden-700" htmlFor="reg-email">
            {t("labelEmail")}
          </label>
          <input
            id="reg-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
            placeholder={t("placeholderEmail")}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-garden-700" htmlFor="reg-phone">
            {t("labelPhone")}
          </label>
          <input
            id="reg-phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className={inputClass}
            placeholder={t("placeholderPhone")}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-garden-700" htmlFor="reg-region">
            {t("labelRegion")}
          </label>
          <select
            id="reg-region"
            required
            value={region}
            onChange={(event) => setRegion(event.target.value)}
            className={inputClass}
          >
            <option value="">{t("regionPlaceholder")}</option>
            {regions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-garden-700" htmlFor="reg-wechat">
            {t("labelWechat")}
          </label>
          <input
            id="reg-wechat"
            type="text"
            value={wechat}
            onChange={(event) => setWechat(event.target.value)}
            className={inputClass}
            placeholder={t("placeholderWechat")}
          />
        </div>

        <fieldset>
          <legend className="mb-2 block text-xs font-medium uppercase tracking-wide text-garden-700">
            {t("labelGardenFeatures")}
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {featureOptions.map((feature) => (
              <label
                key={feature}
                className="flex items-center gap-3 rounded-xl border border-garden-200 bg-garden-50/70 px-3 py-2 text-sm text-garden-800"
              >
                <input
                  type="checkbox"
                  checked={gardenFeatures.includes(feature)}
                  onChange={() => toggleFeature(feature)}
                  className="h-4 w-4 rounded border-garden-300 text-garden-700"
                />
                <span>{feature}</span>
              </label>
            ))}
            <label className="flex items-center gap-3 rounded-xl border border-garden-200 bg-garden-50/70 px-3 py-2 text-sm text-garden-800">
              <input
                type="checkbox"
                checked={otherChecked}
                onChange={() => {
                  toggleFeature(otherLabel);
                  if (otherChecked) setNotes("");
                }}
                className="h-4 w-4 rounded border-garden-300 text-garden-700"
              />
              <span>{otherLabel}</span>
            </label>
          </div>
          {otherChecked && (
            <textarea
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className={`mt-2 ${inputClass} resize-y`}
              placeholder={t("features.otherPlaceholder")}
            />
          )}
        </fieldset>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-garden-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-garden-700 disabled:opacity-70"
        >
          {isSubmitting ? t("submitInFlight") : t("submit")}
        </button>

        <p className="text-xs leading-relaxed text-garden-600">{t("submitHint")}</p>
      </div>

      {errorMessage ? (
        <p className="mt-4 text-sm leading-relaxed text-red-700" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </form>
  );
}