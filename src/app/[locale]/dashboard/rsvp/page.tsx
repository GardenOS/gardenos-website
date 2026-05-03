import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { RsvpAdminPanel } from "@/components/dashboard/RsvpAdminPanel";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboardRsvp");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function DashboardRsvpPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <RsvpAdminPanel />;
}
