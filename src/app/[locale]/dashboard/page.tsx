import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";

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
  return <DashboardPanel scanViewerPath="/dashboard/scan" />;
}
