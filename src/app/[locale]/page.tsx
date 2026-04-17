import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { CrowdfundingProgress } from "@/components/CrowdfundingProgress";

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const videoTitle = locale === "zh" ? "看看它如何工作" : "See how it works";

  return (
    <div className="space-y-16 sm:space-y-20">
      <section className="space-y-8">
        <p className="inline-flex rounded-full border border-garden-200 bg-white px-3 py-1 text-xs font-medium uppercase tracking-wide text-garden-700">
          {t("badge")}
        </p>
        <div className="space-y-5">
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-garden-950 sm:text-4xl lg:text-[2.5rem] lg:leading-tight whitespace-pre-line">
            {t("headline")}
          </h1>
          <p className="max-w-2xl text-pretty text-lg leading-relaxed text-garden-800">{t("sub")}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/participate"
            className="inline-flex items-center justify-center rounded-full bg-garden-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-garden-700"
          >
            {t("ctaPrimary")}
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-full border border-garden-300 bg-white px-5 py-2.5 text-sm font-semibold text-garden-800 transition hover:border-garden-400 hover:bg-garden-50"
          >
            {t("ctaSecondary")}
          </Link>
        </div>
      </section>

      <section aria-label="Crowdfunding progress spotlight" className="relative">
        <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-r from-garden-100/70 via-white to-garden-100/70 blur-2xl" />
        <CrowdfundingProgress currentMembers={2} />
      </section>

      <section aria-labelledby="video-heading" className="space-y-6">
        <h2
          id="video-heading"
          className="text-lg font-semibold tracking-tight text-garden-950 sm:text-xl"
        >
          {videoTitle}
        </h2>
        <div className="mx-auto w-full max-w-[900px]">
          <video
            controls
            preload="metadata"
            className="w-full rounded-2xl border border-garden-200 bg-garden-950 shadow-sm"
          >
            <source src="/videos/gardenos-explainer.mp4" type="video/mp4" />
          </video>
        </div>
      </section>

      <section aria-labelledby="highlights-heading" className="space-y-8">
        <h2
          id="highlights-heading"
          className="text-lg font-semibold tracking-tight text-garden-950 sm:text-xl"
        >
          {t("highlights.title")}
        </h2>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(["col1", "col2", "col3"] as const).map((key) => (
            <li
              key={key}
              className="relative flex flex-col rounded-2xl border border-garden-200/90 bg-white p-6 shadow-sm ring-1 ring-garden-100/80"
            >
              <span
                className="mb-4 h-1 w-10 rounded-full bg-garden-500"
                aria-hidden
              />
              <h3 className="text-base font-semibold text-garden-950">
                {t(`highlights.${key}.title`)}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-garden-800">
                {t(`highlights.${key}.body`)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="prototype-heading">
        <div className="overflow-hidden rounded-2xl border border-garden-700/30 bg-gradient-to-br from-garden-800 via-garden-700 to-garden-600 px-6 py-8 text-garden-50 shadow-lg sm:px-10 sm:py-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-garden-200/90">
            {t("prototype.eyebrow")}
          </p>
          <h2
            id="prototype-heading"
            className="mt-3 max-w-2xl text-xl font-semibold tracking-tight text-white sm:text-2xl"
          >
            {t("prototype.title")}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-garden-100 sm:text-base">
            {t("prototype.body")}
          </p>
          <div className="mt-6">
            <Link
              href="/live"
              className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-garden-900 shadow-sm transition hover:bg-garden-50"
            >
              {t("prototype.cta")}
            </Link>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="register-block-heading"
        className="rounded-2xl border border-garden-200 bg-gradient-to-b from-white to-garden-50/80 px-6 py-10 shadow-sm sm:px-10 sm:py-12"
      >
        <h2
          id="register-block-heading"
          className="max-w-xl text-xl font-semibold tracking-tight text-garden-950 sm:text-2xl"
        >
          {t("registerBlock.title")}
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-garden-800 sm:text-base">
          {t("registerBlock.body")}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-full bg-garden-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-garden-700"
          >
            {t("registerBlock.primaryCta")}
          </Link>
          <Link
            href="/participate"
            className="inline-flex items-center justify-center rounded-full border border-garden-300 bg-white px-6 py-3 text-sm font-semibold text-garden-900 transition hover:border-garden-400 hover:bg-garden-50"
          >
            {t("registerBlock.secondaryCta")}
          </Link>
        </div>
      </section>
    </div>
  );
}
