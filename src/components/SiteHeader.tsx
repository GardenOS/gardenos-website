import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SiteHeaderClerkAuth } from "./SiteHeaderClerkAuth";
import { SiteHeaderDashboardLink } from "./SiteHeaderDashboardLink";

export async function SiteHeader() {
  const t = await getTranslations("nav");

  const links = [
    { href: "/", label: t("home") },
    { href: "/about", label: t("about") },
    { href: "/participate", label: t("participate") },
    { href: "/live", label: t("live") },
    { href: "/live-test", label: t("liveTest") },
    { href: "/register", label: t("register") },
  ] as const;

  return (
    <header className="border-b border-garden-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-semibold tracking-tight text-garden-900">
          GardenOS
        </Link>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-garden-800">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-md px-1 py-0.5 transition hover:text-garden-600"
            >
              {label}
            </Link>
          ))}
          <SiteHeaderDashboardLink />
        </nav>
        <div className="flex flex-wrap items-center gap-3 sm:ml-auto">
          <SiteHeaderClerkAuth />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
