import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LiveAdminPanel } from "@/components/live/LiveAdminPanel";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboardLive");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function DashboardLivePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LiveAdminPanel />;
}
