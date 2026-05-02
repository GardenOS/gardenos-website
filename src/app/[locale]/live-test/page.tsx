import { notFound } from "next/navigation";
import { LiveTestPanel } from "@/components/live/LiveTestPanel";
import { requireAdminUser } from "@/backend/auth/admin";

export default async function LiveTestPage() {
  try {
    await requireAdminUser();
    return <LiveTestPanel />;
  } catch {
    notFound();
  }
}
