import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { RegisterReservationPanel } from "@/components/register/RegisterReservationPanel";
import { countRegistrations } from "@/backend/intake/repository";

type Props = { params: Promise<{ locale: string }> };

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
  let registrationsCount = 0;

  try {
    registrationsCount = await countRegistrations();
  } catch (error) {
    console.warn("[register-page] Failed to load registrations count, using fallback.", error);
  }
  const valueKeys = ["value1", "value2", "value3"] as const;
  const socialProofCount = registrationsCount + 326;

  return (
    <div className="space-y-14 sm:space-y-16">
      <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <div className="space-y-5">
          <p className="inline-flex rounded-full border border-garden-200 bg-white px-3 py-1 text-xs font-medium uppercase tracking-wide text-garden-700">
            {t("badge")}
          </p>
          <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-garden-950 sm:text-4xl lg:text-[2.8rem] lg:leading-[1.15]">
            {t("title")}
          </h1>
          <p className="max-w-2xl text-pretty text-lg leading-relaxed text-garden-800">{t("lead")}</p>
          <div className="inline-flex rounded-2xl border border-garden-200 bg-garden-50 px-4 py-3 text-sm font-medium text-garden-800 shadow-sm">
            {t("socialProof", { count: socialProofCount })}
          </div>
        </div>

        <div>
          <RegisterReservationPanel />
        </div>
      </section>

      <section aria-labelledby="register-value-title" className="space-y-6">
        <h2 id="register-value-title" className="text-2xl font-semibold tracking-tight text-garden-950">
          {t("valueTitle")}
        </h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {valueKeys.map((key) => (
            <article key={key} className="rounded-2xl border border-garden-200 bg-white px-5 py-5 shadow-sm">
              <h3 className="text-base font-semibold text-garden-950">{t(`${key}.title`)}</h3>
              <p className="mt-3 text-sm leading-relaxed text-garden-700">{t(`${key}.body`)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-garden-200 bg-gradient-to-br from-garden-950 via-garden-900 to-garden-800 px-6 py-8 text-white shadow-lg sm:px-8 sm:py-10">
        <h2 className="text-2xl font-semibold tracking-tight">{t("philosophyTitle")}</h2>
        <div className="mt-5 space-y-3 text-base leading-relaxed text-garden-100 sm:text-lg">
          <p>{t("philosophyLine1")}</p>
          <p>{t("philosophyLine2")}</p>
          <p>{t("philosophyLine3")}</p>
        </div>
      </section>
    </div>
  );
}
