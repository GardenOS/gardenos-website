import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { FeatureCard } from "@/components/content/FeatureCard";

type Props = { params: Promise<{ locale: string }> };

const benefits = ["b1", "b2", "b3"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("register");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function RegisterPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("register");

  return (
    <div className="space-y-16 sm:space-y-20">
      <header className="space-y-6">
        <p className="inline-flex rounded-full border border-garden-200 bg-white px-3 py-1 text-xs font-medium uppercase tracking-wide text-garden-700">
          {t("badge")}
        </p>
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-garden-950 sm:text-4xl">
          {t("title")}
        </h1>
        <p className="max-w-3xl text-pretty text-lg leading-relaxed text-garden-800">{t("lead")}</p>
      </header>

      <section aria-labelledby="benefits-heading" className="space-y-8">
        <h2
          id="benefits-heading"
          className="text-lg font-semibold tracking-tight text-garden-950 sm:text-xl"
        >
          {t("benefitsTitle")}
        </h2>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((key) => (
            <li key={key}>
              <FeatureCard title={t(`${key}.title`)}>
                <p>{t(`${key}.body`)}</p>
              </FeatureCard>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="register-flow" className="grid gap-10 lg:grid-cols-5 lg:gap-12">
        <div className="lg:col-span-2">
          <h2
            id="register-flow"
            className="text-lg font-semibold tracking-tight text-garden-950 sm:text-xl"
          >
            {t("formSideTitle")}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-garden-800 sm:text-base">
            {t("formSideBody")}
          </p>
        </div>

        <div className="rounded-2xl border border-garden-200 bg-white p-6 shadow-sm sm:p-8 lg:col-span-3">
          <h2 className="text-lg font-semibold text-garden-950">{t("formTitle")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-garden-700">{t("formHint")}</p>
          <form method="post" action="/api/register" className="mt-8 space-y-5">
            <div>
              <label
                className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-garden-700"
                htmlFor="reg-name"
              >
                {t("labelName")}
              </label>
              <input
                id="reg-name"
                name="name"
                type="text"
                autoComplete="name"
                className="w-full rounded-xl border border-garden-200 bg-garden-50/80 px-4 py-2.5 text-sm text-garden-900 outline-none ring-garden-500/30 placeholder:text-garden-400"
                placeholder={t("placeholderName")}
              />
            </div>
            <div>
              <label
                className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-garden-700"
                htmlFor="reg-email"
              >
                {t("labelEmail")}
              </label>
              <input
                id="reg-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-xl border border-garden-200 bg-garden-50/80 px-4 py-2.5 text-sm text-garden-900 outline-none"
                placeholder={t("placeholderEmail")}
              />
            </div>
            <div>
              <label
                className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-garden-700"
                htmlFor="reg-org"
              >
                {t("labelOrg")}
              </label>
              <input
                id="reg-org"
                name="org"
                type="text"
                autoComplete="organization"
                className="w-full rounded-xl border border-garden-200 bg-garden-50/80 px-4 py-2.5 text-sm text-garden-900 outline-none"
                placeholder={t("placeholderOrg")}
              />
            </div>
            <div>
              <label
                className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-garden-700"
                htmlFor="reg-notes"
              >
                {t("labelNotes")}
              </label>
              <textarea
                id="reg-notes"
                name="notes"
                rows={3}
                className="w-full resize-none rounded-xl border border-garden-200 bg-garden-50/80 px-4 py-2.5 text-sm text-garden-900 outline-none"
                placeholder={t("placeholderNotes")}
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-garden-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-garden-700 sm:w-auto sm:px-8"
            >
              {t("submit")}
            </button>
            <p className="text-xs leading-relaxed text-garden-600">{t("reassurance")}</p>
          </form>
        </div>
      </section>

      <aside
        aria-labelledby="register-side-heading"
        className="rounded-2xl border border-dashed border-garden-300 bg-garden-50/50 px-6 py-6 sm:px-8 sm:py-8"
      >
        <h2 id="register-side-heading" className="text-base font-semibold text-garden-900">
          {t("sideTitle")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-garden-800">{t("sideBody")}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/about"
            className="text-sm font-semibold text-garden-700 underline decoration-garden-300 underline-offset-4 hover:text-garden-900"
          >
            {t("sideAbout")}
          </Link>
          <span className="text-garden-300" aria-hidden>
            ·
          </span>
          <Link
            href="/participate"
            className="text-sm font-semibold text-garden-700 underline decoration-garden-300 underline-offset-4 hover:text-garden-900"
          >
            {t("sideParticipate")}
          </Link>
        </div>
      </aside>
    </div>
  );
}
