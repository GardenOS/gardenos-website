import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { FeatureCard } from "@/components/content/FeatureCard";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");

  return (
    <div className="space-y-16 sm:space-y-20">
      <header className="space-y-6">
        <p className="inline-flex rounded-full border border-garden-200 bg-white px-3 py-1 text-xs font-medium uppercase tracking-wide text-garden-700">
          {t("badge")}
        </p>
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-garden-950 sm:text-4xl">
          {t("title")}
        </h1>
        <p className="max-w-3xl text-pretty text-lg leading-relaxed text-garden-800">
          {t("origin")}
        </p>
        <p className="max-w-3xl text-pretty text-lg leading-relaxed text-garden-800">{t("lead")}</p>
      </header>

      <section aria-labelledby="problems-heading" className="space-y-8">
        <h2
          id="problems-heading"
          className="text-lg font-semibold tracking-tight text-garden-950 sm:text-xl"
        >
          {t("problems.title")}
        </h2>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(["p1", "p2", "p3"] as const).map((key) => (
            <li key={key}>
              <FeatureCard title={t(`problems.${key}.title`)}>
                <p>{t(`problems.${key}.body`)}</p>
              </FeatureCard>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="mission-vision" className="grid gap-6 lg:grid-cols-2">
        <h2 id="mission-vision" className="sr-only">
          {t("mission.title")} / {t("vision.title")}
        </h2>
        <div className="rounded-2xl border border-garden-200/90 bg-white p-6 shadow-sm ring-1 ring-garden-100/80 sm:p-8">
          <span className="mb-4 block h-1 w-10 rounded-full bg-garden-500" aria-hidden />
          <h3 className="text-lg font-semibold text-garden-950">{t("mission.title")}</h3>
          <p className="mt-3 text-sm leading-relaxed text-garden-800 sm:text-base">{t("mission.body")}</p>
        </div>
        <div className="rounded-2xl border border-garden-200/90 bg-white p-6 shadow-sm ring-1 ring-garden-100/80 sm:p-8">
          <span className="mb-4 block h-1 w-10 rounded-full bg-garden-400" aria-hidden />
          <h3 className="text-lg font-semibold text-garden-950">{t("vision.title")}</h3>
          <p className="mt-3 text-sm leading-relaxed text-garden-800 sm:text-base">{t("vision.body")}</p>
        </div>
      </section>

      <section aria-labelledby="values-heading" className="space-y-8">
        <h2
          id="values-heading"
          className="text-lg font-semibold tracking-tight text-garden-950 sm:text-xl"
        >
          {t("values.title")}
        </h2>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(["v1", "v2", "v3"] as const).map((key) => (
            <li key={key}>
              <FeatureCard title={t(`values.${key}.title`)}>
                <p>{t(`values.${key}.body`)}</p>
              </FeatureCard>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="changelog-heading" className="space-y-8">
        <h2
          id="changelog-heading"
          className="text-lg font-semibold tracking-tight text-garden-950 sm:text-xl"
        >
          {t("changelogTitle")}
        </h2>
        <ul className="relative space-y-0 border-l-2 border-garden-200 pl-8">
          {(["rel1", "rel2", "rel3"] as const).map((key) => (
            <li key={key} className="relative pb-10 last:pb-0">
              <span
                className="absolute -left-[calc(0.5rem+1px)] top-1.5 flex h-3 w-3 -translate-x-1/2 rounded-full border-2 border-white bg-garden-500 shadow-sm"
                aria-hidden
              />
              <div className="rounded-xl border border-garden-200/90 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-garden-950 sm:text-base">
                  {t(`changelog.${key}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-garden-800">
                  {t(`changelog.${key}.body`)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="about-cta-heading">
        <div className="overflow-hidden rounded-2xl border border-garden-700/30 bg-gradient-to-br from-garden-800 via-garden-700 to-garden-600 px-6 py-8 text-garden-50 shadow-lg sm:px-10 sm:py-10">
          <h2
            id="about-cta-heading"
            className="max-w-xl text-xl font-semibold tracking-tight text-white sm:text-2xl"
          >
            {t("cta.title")}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-garden-100 sm:text-base">
            {t("cta.body")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/participate"
              className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-garden-900 shadow-sm transition hover:bg-garden-50"
            >
              {t("cta.primary")}
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              {t("cta.secondary")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
