"use client";

import type { ReactNode } from "react";
import { Show } from "@clerk/react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

/** Clerk v7: signed-in gate via `Show when="signed-in"`. */
function SignedIn({ children }: { children: ReactNode }) {
  return <Show when="signed-in">{children}</Show>;
}

export function SiteHeaderDashboardLink() {
  const t = useTranslations("nav");

  return (
    <SignedIn>
      <Link
        href="/dashboard"
        className="rounded-md px-1 py-0.5 transition hover:text-garden-600"
      >
        {t("dashboard")}
      </Link>
    </SignedIn>
  );
}
