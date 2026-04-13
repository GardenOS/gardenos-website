import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { FeatureCard } from "@/components/content/FeatureCard";
import { RegisterForm } from "@/components/register/RegisterForm";

type Props = { params: Promise<{ locale: string }> };

const benefits = ["b1", "b2", "b3"] as const;
const regSteps = ["s1", "s2", "s3"] as const;

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
            {t("stepsTitle")}
          </h2>
          <ol className="mt-8 space-y-6">
            {regSteps.map((key, index) => (
              <li key={key} className="flex gap-4">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-garden-100 text-sm font-bold text-garden-800"
                  aria-hidden
                >
                  {index + 1}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-garden-950">{t(`${key}.title`)}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-garden-800">{t(`${key}.body`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <RegisterForm
          labels={{
            formTitle: t("formTitle"),
            formHint: t("formHint"),
            labelName: t("labelName"),
            labelEmail: t("labelEmail"),
            labelOrg: t("labelOrg"),
            labelNotes: t("labelNotes"),
            submitLabel: t("submit"),
            privacy: t("privacy"),
            successMsg: t("submitSuccessTitle"),
            errorMsg: t("submitErrorBody")
          }}
        />
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
