import { MotifGraphic } from "@/components/motif-graphic";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <article>
      <Card className="overflow-hidden rounded-3xl py-0">
        <MotifGraphic id={card.id} color={card.color} size="detail" />
        <CardHeader className="space-y-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Hilfsgrafik · {card.category}
          </p>
          <CardTitle className="font-heading text-3xl">{card.title}</CardTitle>
          <CardDescription className="text-base">{card.summary}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pb-6">
          {card.stitchHint && (
            <p className="rounded-2xl bg-muted px-3 py-2 text-sm">{card.stitchHint}</p>
          )}
          <ol className="list-decimal space-y-2 pl-5">
            {card.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          {card.relatedHelp && card.relatedHelp.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Dazu passend</p>
              <ul className="mt-2 space-y-1">
                {card.relatedHelp.map((helpId) => {
                  const help = getHelpCard(helpId);
                  if (!help) return null;
                  return (
                    <li key={helpId}>
                      <Link href={`/cards/help/${helpId}`} className="text-primary underline">
                        {help.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          <Button asChild variant="ghost" className="px-0 text-muted-foreground">
            <Link href="/cards">Zurück zu den Karten</Link>
          </Button>
        </CardContent>
      </Card>
    </article>
  );
}
