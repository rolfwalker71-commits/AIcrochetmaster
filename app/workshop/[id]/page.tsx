import { WorkshopLoader } from "@/components/workshop-loader";

export default async function WorkshopPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WorkshopLoader id={id} />;
}
