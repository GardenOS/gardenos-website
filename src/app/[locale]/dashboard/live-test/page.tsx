import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LiveTestPanel } from "@/components/live/LiveTestPanel";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("liveTest");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function DashboardLiveTestPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LiveTestPanel />;
}
