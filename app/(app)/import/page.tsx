import { ImportWizard } from "@/components/import-wizard";

export default async function ImportPage({
  searchParams,
}: {
  searchParams: Promise<{ text?: string; url?: string; title?: string; kind?: string }>;
}) {
  const params = await searchParams;
  const initialText = [params.url, params.text, params.title].find(Boolean) || "";
  const initialKind = params.kind === "pdf" ? "pdf" : "video";
  return <ImportWizard key={`${initialKind}-${initialText}`} initialText={initialText} initialKind={initialKind} />;
}
