"use client";

import { MotifGraphic } from "@/components/motif-graphic";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HELP_CARDS, MOTIF_CARDS, uniqueCategories } from "@/lib/cards";
import type { HelpCard, MotifCard } from "@/lib/types";
import Link from "next/link";
import { useMemo, useState } from "react";

type Deck = "motif" | "help";

export function CardCatalog() {
  const [deck, setDeck] = useState<Deck>("motif");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("alle");

  const cards = deck === "motif" ? MOTIF_CARDS : HELP_CARDS;
  const categories = uniqueCategories(cards);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cards.filter((card) => {
      const catOk = category === "alle" || card.category === category;
      if (!catOk) return false;
      if (!q) return true;
      const hay = `${card.title} ${card.category} ${
        "summary" in card ? card.summary : card.body
      }`.toLowerCase();
      return hay.includes(q);
    });
  }, [cards, category, query]);

  return (
    <div className="space-y-4">
      <Tabs
        value={deck}
        onValueChange={(value) => {
          setDeck(value as Deck);
          setCategory("alle");
        }}
      >
        <TabsList className="grid h-12 w-full grid-cols-2" aria-label="Kartentyp">
          <TabsTrigger value="motif" className="min-h-10">
            Motivkarten
          </TabsTrigger>
          <TabsTrigger value="help" className="min-h-10">
            Hilfekarten
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <label className="block">
        <span className="sr-only">Karten durchsuchen</span>
        <Input
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          placeholder="Karten durchsuchen …"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Kategorie">
        {["alle", ...categories].map((item) => (
          <Button
            key={item}
            type="button"
            size="sm"
            variant={category === item ? "default" : "outline"}
            aria-pressed={category === item}
            onClick={() => setCategory(item)}
            className="rounded-full"
          >
            {item}
          </Button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} Karten</p>

      <div className="grid gap-3">
        {filtered.map((card) => (
          <CatalogCard key={card.id} deck={deck} card={card} />
        ))}
      </div>
    </div>
  );
}

function CatalogCard({
  deck,
  card,
}: {
  deck: Deck;
  card: MotifCard | HelpCard;
}) {
  const href = deck === "motif" ? `/cards/motif/${card.id}` : `/cards/help/${card.id}`;
  const text = "summary" in card ? card.summary : card.body;
  return (
    <Link href={href} className="block">
      <Card className="overflow-hidden rounded-3xl py-0">
        <MotifGraphic id={card.id} color={card.color} />
        <CardHeader className="pb-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{card.category}</p>
          <CardTitle className="font-heading text-xl">{card.title}</CardTitle>
          <CardDescription className="line-clamp-2">{text}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
