import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { auth } from "@clerk/nextjs/server";

export async function SiteHeaderDashboardLink() {
  const [t, { userId }] = await Promise.all([getTranslations("nav"), auth()]);

  if (!userId) {
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
