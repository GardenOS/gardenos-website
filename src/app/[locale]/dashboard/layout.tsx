import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/backend/auth/admin";
import { DashboardTopNav } from "@/components/dashboard/DashboardTopNav";

type Props = {
  children: ReactNode;
};

export default async function DashboardLayout({ children }: Props) {
  try {
    await requireAdminUser();
    const tNav = await getTranslations("dashboardNav");

    return (
      <div className="space-y-6">
        <DashboardTopNav
          labels={{
            scans: tNav("scans"),
            live: tNav("live"),
            liveTest: tNav("liveTest"),
            rsvp: tNav("rsvp"),
            whitelist: tNav("whitelist"),
          }}
        />
        {children}
      </div>
    );
  } catch {
    notFound();
  }
}
