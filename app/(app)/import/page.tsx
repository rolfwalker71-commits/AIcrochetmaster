import { ImportWizard } from "@/components/import-wizard";

export default async function ImportPage({
  searchParams,
}: {
  searchParams: Promise<{ text?: string; url?: string; title?: string }>;
}) {
  const params = await searchParams;
  const initialText = [params.url, params.text, params.title].find(Boolean) || "";
  return <ImportWizard key={initialText} initialText={initialText} />;
}
