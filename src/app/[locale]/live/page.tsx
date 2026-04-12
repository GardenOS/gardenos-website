import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { FeatureCard } from "@/components/content/FeatureCard";

type Props = { params: Promise<{ locale: string }> };

const channels = ["ch1", "ch2", "ch3"] as const;
const releases = ["rel1", "rel2", "rel3"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("live");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function LivePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("live");

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

      <section aria-labelledby="window-heading">
        <div className="overflow-hidden rounded-2xl border border-garden-700/30 bg-gradient-to-br from-garden-800 via-garden-700 to-garden-600 px-6 py-8 text-garden-50 shadow-lg sm:px-10 sm:py-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-garden-200/90">
            {t("windowEyebrow")}
          </p>
          <h2
            id="window-heading"
            className="mt-3 max-w-2xl text-xl font-semibold tracking-tight text-white sm:text-2xl"
          >
            {t("windowTitle")}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-garden-100 sm:text-base">
            {t("windowBody")}
          </p>
          <p className="mt-4 max-w-2xl border-t border-white/15 pt-4 text-xs leading-relaxed text-garden-200/95 sm:text-sm">
            {t("windowNote")}
          </p>
        </div>
      </section>

      <section aria-labelledby="channels-heading" className="space-y-8">
        <h2
          id="channels-heading"
          className="text-lg font-semibold tracking-tight text-garden-950 sm:text-xl"
        >
          {t("channelsTitle")}
        </h2>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {channels.map((key) => (
            <li key={key}>
              <FeatureCard title={t(`${key}.title`)}>
                <p>{t(`${key}.body`)}</p>
              </FeatureCard>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="releases-heading" className="space-y-8">
        <h2
          id="releases-heading"
          className="text-lg font-semibold tracking-tight text-garden-950 sm:text-xl"
        >
          {t("releasesTitle")}
        </h2>
        <ul className="relative space-y-0 border-l-2 border-garden-200 pl-8">
          {releases.map((key) => (
            <li key={key} className="relative pb-10 last:pb-0">
              <span
                className="absolute -left-[calc(0.5rem+1px)] top-1.5 flex h-3 w-3 -translate-x-1/2 rounded-full border-2 border-white bg-garden-500 shadow-sm"
                aria-hidden
              />
              <div className="rounded-xl border border-garden-200/90 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-garden-950 sm:text-base">
                  {t(`${key}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-garden-800">{t(`${key}.body`)}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="live-banner-heading">
        <div className="rounded-2xl border border-garden-200 bg-gradient-to-b from-white to-garden-50/80 px-6 py-10 shadow-sm sm:px-10 sm:py-12">
          <h2
            id="live-banner-heading"
            className="max-w-xl text-xl font-semibold tracking-tight text-garden-950 sm:text-2xl"
          >
            {t("bannerTitle")}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-garden-800 sm:text-base">
            {t("bannerBody")}
          </p>
          <div className="mt-8">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-full bg-garden-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-garden-700"
            >
              {t("bannerCta")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
