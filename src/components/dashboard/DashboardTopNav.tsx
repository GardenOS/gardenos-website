"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/routing";

type NavItem = {
  href:
    | "/dashboard"
    | "/dashboard/live"
    | "/dashboard/live-test"
    | "/dashboard/rsvp"
    | "/dashboard/whitelist";
  labelKey: "scans" | "live" | "liveTest" | "rsvp" | "whitelist";
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", labelKey: "scans" },
  { href: "/dashboard/live", labelKey: "live" },
  { href: "/dashboard/live-test", labelKey: "liveTest" },
  { href: "/dashboard/rsvp", labelKey: "rsvp" },
  { href: "/dashboard/whitelist", labelKey: "whitelist" },
];

export function DashboardTopNav() {
  const t = useTranslations("dashboardNav");
  // pathname includes locale prefix, e.g. "/zh/dashboard/live"
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === "/dashboard") {
      // only exact dashboard root (after locale)
      return /^\/[^/]+\/dashboard$/.test(pathname);
    }
    return pathname.includes(href);
  }

  return (
    <nav className="flex flex-wrap gap-1 rounded-2xl border border-garden-200 bg-white px-3 py-3 shadow-sm">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            isActive(item.href)
              ? "bg-garden-600 text-white"
              : "text-garden-700 hover:bg-garden-100"
          }`}
        >
          {t(item.labelKey)}
        </Link>
      ))}
    </nav>
  );
}
