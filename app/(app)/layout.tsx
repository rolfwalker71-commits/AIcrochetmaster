import { requirePageAccess } from "@/lib/guard";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  await requirePageAccess();
  return children;
}
