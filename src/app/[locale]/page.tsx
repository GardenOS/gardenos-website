import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  const pitfallsBody = t("pitfalls.body");
  const pitfallsParagraphs =
    pitfallsBody.includes("\n") ? pitfallsBody.split(/\n+/).filter(Boolean) : pitfallsBody.split(locale === "zh" ? /(?<=。)\s*/ : /(?<=[.!?])\s+/).filter(Boolean);

  return (
    <div className="space-y-0">
      <section className="bg-black">
        <div className="relative overflow-hidden bg-black min-h-[600px]">
            <img
              src="/images/hero-lawn.jpg"
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              aria-hidden
            />
            <div className="absolute inset-0 bg-black/60" aria-hidden />
            <div className="relative z-10 flex min-h-[600px] items-end">
              <div className="mx-auto w-full max-w-5xl px-4 pb-10 pt-24 sm:px-6 lg:px-8 sm:pb-12 lg:pb-14">
                <div className="max-w-3xl space-y-4">
                  <h1 className="text-balance text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                    {t("hero.title")}
                  </h1>
                  <p className="text-pretty text-lg leading-relaxed text-white/85 sm:text-xl">
                    {t("hero.subtitle")}
                  </p>
                  <p className="text-pretty text-lg font-black leading-relaxed text-white sm:text-xl">
                    {t("hero.thirdLine")}
                  </p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <Link
                      href="/register"
                      className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-green-700 shadow-sm transition hover:bg-green-600 hover:text-white"
                    >
                      {t("hero.cta")}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <section
            aria-label={t("stats.ariaLabel")}
            className="mx-auto mt-8 max-w-5xl overflow-hidden rounded-2xl bg-zinc-900 shadow-sm ring-1 ring-white/10"
          >
            <dl className="grid divide-y divide-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <div className="px-6 py-6 sm:px-8">
                <dt className="text-xs font-semibold uppercase tracking-wide text-white/70">
                  {t("stats.item1.label")}
                </dt>
                <dd className="mt-2 text-2xl font-bold text-white">{t("stats.item1.value")}</dd>
              </div>
              <div className="px-6 py-6 sm:px-8">
                <dt className="text-xs font-semibold uppercase tracking-wide text-white/70">
                  {t("stats.item2.label")}
                </dt>
                <dd className="mt-2 text-2xl font-bold text-white">{t("stats.item2.value")}</dd>
              </div>
              <div className="px-6 py-6 sm:px-8">
                <dt className="text-xs font-semibold uppercase tracking-wide text-white/70">
                  {t("stats.item3.label")}
                </dt>
                <dd className="mt-2 text-2xl font-bold text-white">{t("stats.item3.value")}</dd>
              </div>
            </dl>
          </section>
      </section>

      <section aria-labelledby="section-pitfalls" className="bg-white">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 sm:py-16">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
            <div className="hidden lg:col-span-1 lg:block" aria-hidden>
              <div className="h-full w-1.5 rounded-full bg-green-600" />
            </div>
            <div className="lg:col-span-11 space-y-6">
              <h2 id="section-pitfalls" className="text-balance text-3xl font-black tracking-tight text-garden-950 sm:text-4xl">
                {t("pitfalls.title")}
              </h2>
              <div className="max-w-4xl space-y-4 text-pretty text-lg leading-relaxed text-garden-800">
                {pitfallsParagraphs.map((text) => (
                  <p key={text}>{text}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="section-scenarios" className="bg-white">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 sm:py-16 space-y-10">
          <div className="space-y-3">
            <h2 id="section-scenarios" className="text-balance text-3xl font-black tracking-tight text-garden-950 sm:text-4xl">
              {t("scenarios.title")}
            </h2>
            <p className="max-w-4xl text-pretty text-sm leading-relaxed text-garden-800 sm:text-base">
              {t("scenarios.subtitle")}
            </p>
          </div>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(["s1", "s2", "s3", "s4", "s5", "s6"] as const).map((key, idx) => (
              <li
                key={key}
                className="group rounded-2xl border border-garden-200/90 bg-white p-6 shadow-sm ring-1 ring-garden-100/80 transition duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="text-4xl font-black leading-none text-green-600" aria-hidden>
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="mt-1 h-2 w-2 rounded-full bg-green-600/30" aria-hidden />
                </div>
                <h3 className="mt-4 text-xl font-bold tracking-tight text-garden-950">
                  {t(`scenarios.${key}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-garden-800">{t(`scenarios.${key}.body`)}</p>
              </li>
            ))}
          </ul>
          <div className="rounded-2xl bg-green-800 px-6 py-5 text-center text-white shadow-sm">
            <p className="text-pretty text-sm font-semibold leading-relaxed sm:text-base">{t("scenarios.ending")}</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="section-priority" className="bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 sm:py-16 space-y-10">
          <h2 id="section-priority" className="text-balance text-3xl font-black tracking-tight text-garden-950 sm:text-4xl">
            {t("priorityPlan.title")}
          </h2>
          <div className="max-w-3xl">
              <p className="text-pretty text-base leading-relaxed text-garden-800 sm:text-lg">{t("priorityPlan.body")}</p>
              <ol className="mt-6 space-y-4">
                {(["p1", "p2", "p3"] as const).map((key, idx) => (
                  <li key={key} className="flex gap-4">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white shadow-sm"
                      aria-hidden
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-garden-950">{t(`priorityPlan.${key}.title`)}</p>
                      <p className="mt-1 text-sm leading-relaxed text-garden-800">{t(`priorityPlan.${key}.body`)}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/dashboard/scan"
                  className="inline-flex items-center justify-center rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
                >
                  {t("priorityPlan.cta")}
                </Link>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-garden-600 sm:text-sm">{t("priorityPlan.note")}</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="section-alliance" className="bg-zinc-900 text-white">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 sm:py-16 space-y-10">
          <h2 id="section-alliance" className="text-balance text-3xl font-black tracking-tight sm:text-4xl">
            {t("alliance.title")}
          </h2>
          <p className="max-w-4xl text-pretty text-base leading-relaxed text-white/85 sm:text-lg">{t("alliance.body")}</p>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {(["a1", "a2", "a3", "a4"] as const).map((key) => (
              <li
                key={key}
                className="rounded-2xl border border-zinc-700 bg-zinc-800 p-6 shadow-sm"
              >
                <h3 className="text-base font-semibold text-white">{t(`alliance.${key}.title`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/80">{t(`alliance.${key}.body`)}</p>
              </li>
            ))}
          </ul>
          <div className="pt-2">
            <Link
              href="/register"
              className="inline-flex w-full items-center justify-center rounded-full bg-green-600 px-6 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-green-700"
            >
              {t("alliance.cta")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
