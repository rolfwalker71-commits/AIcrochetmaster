import { MotifGraphic } from "@/components/motif-graphic";
import { getHelpCard, getMotifCard } from "@/lib/cards";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function MotifCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const card = getMotifCard(id);
  if (!card) notFound();

  return (
    <article className="overflow-hidden rounded-3xl bg-foam card-shadow">
      <MotifGraphic id={card.id} color={card.color} size="detail" />
      <div className="space-y-4 p-5">
        <p className="text-xs uppercase tracking-wide text-muted">Hilfsgrafik · {card.category}</p>
        <h2 className="font-display text-3xl">{card.title}</h2>
        <p className="text-muted">{card.summary}</p>
        {card.stitchHint && (
          <p className="rounded-2xl bg-cream px-3 py-2 text-sm">{card.stitchHint}</p>
        )}
        <ol className="list-decimal space-y-2 pl-5">
          {card.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        {card.relatedHelp && card.relatedHelp.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Dazu passend</p>
            <ul className="mt-2 space-y-1">
              {card.relatedHelp.map((helpId) => {
                const help = getHelpCard(helpId);
                if (!help) return null;
                return (
                  <li key={helpId}>
                    <Link href={`/cards/help/${helpId}`} className="text-terracotta underline">
                      {help.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        <Link href="/cards" className="block text-sm text-muted">
          Zurück zu den Karten
        </Link>
      </div>
    </article>
  );
}
