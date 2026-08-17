import { MotifGraphic } from "@/components/motif-graphic";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <article>
      <Card className="overflow-hidden rounded-3xl py-0">
        <MotifGraphic id={card.id} color={card.color} size="detail" />
        <CardHeader className="space-y-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Hilfsgrafik · {card.category}
          </p>
          <CardTitle className="font-heading text-3xl">{card.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pb-6">
          <p>{card.body}</p>
          {card.tips && card.tips.length > 0 && (
            <ul className="space-y-2">
              {card.tips.map((tip) => (
                <li key={tip} className="rounded-2xl bg-muted px-3 py-2 text-sm">
                  {tip}
                </li>
              ))}
            </ul>
          )}
          <Button asChild variant="ghost" className="px-0 text-muted-foreground">
            <Link href="/cards">Zurück zu den Karten</Link>
          </Button>
        </CardContent>
      </Card>
    </article>
  );
}
