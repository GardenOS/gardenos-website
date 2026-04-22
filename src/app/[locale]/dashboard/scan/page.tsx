import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LasScanViewerPage } from "@/components/dashboard/LasScanViewerPage";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboardScan");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

function ScanFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-garden-800/60 bg-garden-950/80 text-sm text-garden-400">
      …
    </div>
  );
}

export default async function DashboardScanPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={<ScanFallback />}>
      <LasScanViewerPage />
    </Suspense>
  );
}
