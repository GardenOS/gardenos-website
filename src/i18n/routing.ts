import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["zh", "en"],
  defaultLocale: "zh",
  localePrefix: "always",
});

const localeList = routing.locales as readonly string[];

/** Locale guard without `hasLocale` (avoids use-intl / next-intl export mismatches). */
export function isRoutingLocale(locale: string | undefined): boolean {
  return typeof locale === "string" && localeList.includes(locale);
}

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
