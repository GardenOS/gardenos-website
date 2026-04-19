import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { FeatureCard } from "@/components/content/FeatureCard";
import { RegisterForm } from "@/components/RegisterForm";

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
          <RegisterForm
            defaultLanguage={locale === "zh" ? "中文" : "English"}
            labelFullName={t("labelFullName")}
            labelWeChatId={t("labelWeChatId")}
            labelPhone={t("labelPhone")}
            labelEmail={t("labelEmail")}
            labelPreferredContact={t("labelPreferredContact")}
            labelLanguage={t("labelLanguage")}
            labelSubscriptionPlan={t("labelSubscriptionPlan")}
            placeholderFullName={t("placeholderFullName")}
            placeholderWeChatId={t("placeholderWeChatId")}
            placeholderPhone={t("placeholderPhone")}
            placeholderEmail={t("placeholderEmail")}
            placeholderPreferredContact={t("placeholderPreferredContact")}
            placeholderSubscriptionPlan={t("placeholderSubscriptionPlan")}
            languageOptionEnglish={t("languageOptionEnglish")}
            languageOptionChinese={t("languageOptionChinese")}
            submit={t("submit")}
            reassurance={t("reassurance")}
            submitSuccess={t("submitSuccess")}
            submitError={t("submitError")}
            submitMissingConfig={t("submitMissingConfig")}
            submitInFlight={t("submitInFlight")}
          />
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
