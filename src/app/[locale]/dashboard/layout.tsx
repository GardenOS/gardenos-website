import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/backend/auth/admin";
import { DashboardTopNav } from "@/components/dashboard/DashboardTopNav";

type Props = {
  children: ReactNode;
};

export default async function DashboardLayout({ children }: Props) {
  try {
    await requireAdminUser();
    return (
      <div className="space-y-6">
        <DashboardTopNav />
        {children}
      </div>
    );
  } catch {
    notFound();
  }
}
