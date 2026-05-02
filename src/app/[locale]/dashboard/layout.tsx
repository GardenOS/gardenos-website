import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/backend/auth/admin";

type Props = {
  children: ReactNode;
};

export default async function DashboardLayout({ children }: Props) {
  try {
    await requireAdminUser();
    return <>{children}</>;
  } catch {
    notFound();
  }
}
