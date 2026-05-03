"use client";

import { usePathname } from "next/navigation";
import { Link } from "@/i18n/routing";

type NavItem = {
  href:
    | "/dashboard"
    | "/dashboard/live"
    | "/dashboard/live-test"
    | "/dashboard/rsvp"
    | "/dashboard/whitelist";
  label: string;
};

type DashboardTopNavProps = {
  labels: {
    scans: string;
    live: string;
    liveTest: string;
    rsvp: string;
    whitelist: string;
  };
};

export function DashboardTopNav({ labels }: DashboardTopNavProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { href: "/dashboard", label: labels.scans },
    { href: "/dashboard/live", label: labels.live },
    { href: "/dashboard/live-test", label: labels.liveTest },
    { href: "/dashboard/rsvp", label: labels.rsvp },
    { href: "/dashboard/whitelist", label: labels.whitelist },
  ];

  function isActive(href: string): boolean {
    if (href === "/dashboard") {
      // only exact dashboard root (after locale)
      return /^\/[^/]+\/dashboard$/.test(pathname);
    }
    return pathname.includes(href);
  }

  return (
    <nav className="flex flex-wrap gap-1 rounded-2xl border border-garden-200 bg-white px-3 py-3 shadow-sm">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            isActive(item.href)
              ? "bg-garden-600 text-white"
              : "text-garden-700 hover:bg-garden-100"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
