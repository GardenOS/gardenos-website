import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { isCurrentUserInternal } from "@/backend/auth/admin";

export async function SiteHeaderDashboardLink() {
  const [t, isInternal] = await Promise.all([
    getTranslations("nav"),
    isCurrentUserInternal(),
  ]);

  if (!isInternal) {
    return null;
  }

  return (
    <Link
      href="/dashboard"
      className="rounded-md px-1 py-0.5 transition hover:text-garden-600"
    >
      {t("dashboard")}
    </Link>
  );
}
