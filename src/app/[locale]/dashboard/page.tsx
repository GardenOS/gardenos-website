import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { Link } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-garden-200 bg-white px-4 py-4 text-sm text-garden-800 shadow-sm">
        <p className="mb-2 font-medium text-garden-900">{t("liveManageHint")}</p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/live"
            className="inline-flex items-center rounded-full bg-garden-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-garden-700"
          >
            {t("liveManageCta")}
          </Link>
          <Link
            href="/dashboard/whitelist"
            className="inline-flex items-center rounded-full border border-garden-300 bg-white px-4 py-2 text-sm font-semibold text-garden-800 transition hover:bg-garden-50"
          >
            {t("whitelistCta")}
          </Link>
        </div>
      </div>
      <DashboardPanel scanViewerPath="/dashboard/scan" />
    </div>
  );
}
