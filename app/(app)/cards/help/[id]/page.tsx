import { MotifGraphic } from "@/components/motif-graphic";
import { getHelpCard } from "@/lib/cards";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function HelpCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const card = getHelpCard(id);
  if (!card) notFound();

  return (
    <article className="overflow-hidden rounded-3xl bg-foam card-shadow">
      <MotifGraphic id={card.id} color={card.color} size="detail" />
      <div className="space-y-4 p-5">
        <p className="text-xs uppercase tracking-wide text-muted">Hilfsgrafik · {card.category}</p>
        <h2 className="font-display text-3xl">{card.title}</h2>
        <p>{card.body}</p>
        {card.tips && card.tips.length > 0 && (
          <ul className="space-y-2">
            {card.tips.map((tip) => (
              <li key={tip} className="rounded-2xl bg-cream px-3 py-2 text-sm">
                {tip}
              </li>
            ))}
          </ul>
        )}
        <Link href="/cards" className="block text-sm text-muted">
          Zurück zu den Karten
        </Link>
      </div>
    </article>
  );
}
