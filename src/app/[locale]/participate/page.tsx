import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

const steps = ["step1", "step2", "step3"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("participate");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function ParticipatePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("participate");

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

      <section aria-labelledby="paths-heading" className="space-y-10">
        <h2
          id="paths-heading"
          className="text-lg font-semibold tracking-tight text-garden-950 sm:text-xl"
        >
          {t("pathsTitle")}
        </h2>
        <ol className="grid gap-8 lg:grid-cols-3">
          {steps.map((key, index) => (
            <li key={key} className="relative flex gap-4">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-garden-600 text-sm font-bold text-white shadow-sm"
                aria-hidden
              >
                {index + 1}
              </div>
              <div className="min-w-0 flex-1 rounded-2xl border border-garden-200/90 bg-white p-5 shadow-sm ring-1 ring-garden-100/80">
                <h3 className="text-base font-semibold text-garden-950">{t(`${key}.title`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-garden-800">{t(`${key}.body`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="participate-cta-heading">
        <div className="overflow-hidden rounded-2xl border border-garden-700/30 bg-gradient-to-br from-garden-800 via-garden-700 to-garden-600 px-6 py-8 text-garden-50 shadow-lg sm:px-10 sm:py-10">
          <h2
            id="participate-cta-heading"
            className="max-w-xl text-xl font-semibold tracking-tight text-white sm:text-2xl"
          >
            {t("ctaTitle")}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-garden-100 sm:text-base">
            {t("ctaBody")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/live"
              className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-garden-900 shadow-sm transition hover:bg-garden-50"
            >
              {t("ctaLive")}
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              {t("ctaRegister")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
