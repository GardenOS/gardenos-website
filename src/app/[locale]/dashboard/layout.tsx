import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { isCurrentUserInternal } from "@/backend/auth/admin";
import { DashboardTopNav } from "@/components/dashboard/DashboardTopNav";

type Props = {
  children: ReactNode;
};

export default async function DashboardLayout({ children }: Props) {
  const tNav = await getTranslations("dashboardNav");
  const isInternal = await isCurrentUserInternal();

  return (
    <div className="space-y-6">
      <DashboardTopNav
        isInternal={isInternal}
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
}
