import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
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

      <section aria-labelledby="register-form-heading" className="max-w-xl">
        <h2
          id="register-form-heading"
          className="sr-only"
        >
          {t("formSectionTitle")}
        </h2>
        <RegisterForm
          locale={locale}
          copy={{
            labelName: t("labelName"),
            labelEmail: t("labelEmail"),
            labelOrg: t("labelOrg"),
            labelOptionalContact: t("labelOptionalContact"),
            labelScenario: t("labelScenario"),
            placeholderName: t("placeholderName"),
            placeholderEmail: t("placeholderEmail"),
            placeholderOrg: t("placeholderOrg"),
            placeholderOptionalContact: t("placeholderOptionalContact"),
            placeholderScenario: t("placeholderScenario"),
            submit: t("submit"),
            submitInFlight: t("submitInFlight"),
            successTitle: t("successTitle"),
            successBody: t("successBody"),
            submitError: t("submitError"),
            submitMissingConfig: t("submitMissingConfig"),
          }}
        />
      </section>
    </div>
  );
}
