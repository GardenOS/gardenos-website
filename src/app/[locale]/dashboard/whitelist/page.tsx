import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { WhitelistAdminPanel } from "@/components/dashboard/WhitelistAdminPanel";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboardWhitelist");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function DashboardWhitelistPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <WhitelistAdminPanel />;
}
