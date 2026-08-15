import { requirePageAccess } from "@/lib/guard";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  await requirePageAccess();
  return children;
}
