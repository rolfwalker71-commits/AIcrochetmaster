import { PatternDetail } from "@/components/pattern-detail";

export default async function PatternPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PatternDetail id={id} />;
}
