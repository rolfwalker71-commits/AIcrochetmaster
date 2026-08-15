"use client";

import { MotifGraphic } from "@/components/motif-graphic";
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
      <div className="grid grid-cols-2 gap-2 rounded-full bg-foam p-1">
        <button
          type="button"
          className={`rounded-full py-2 text-sm font-semibold ${deck === "motif" ? "bg-terracotta text-white" : ""}`}
          onClick={() => {
            setDeck("motif");
            setCategory("alle");
          }}
        >
          Motivkarten
        </button>
        <button
          type="button"
          className={`rounded-full py-2 text-sm font-semibold ${deck === "help" ? "bg-terracotta text-white" : ""}`}
          onClick={() => {
            setDeck("help");
            setCategory("alle");
          }}
        >
          Hilfekarten
        </button>
      </div>

      <input
        className="w-full rounded-2xl border border-line bg-foam px-3 py-2"
        placeholder="Karten durchsuchen …"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      <div className="flex flex-wrap gap-1.5">
        {["alle", ...categories].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={`rounded-full px-2 py-0.5 text-[11px] leading-tight ${
              category === item ? "bg-ink text-cream" : "bg-foam"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted">{filtered.length} Karten</p>

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
    <Link
      href={href}
      className="card-shadow block overflow-hidden rounded-3xl bg-foam"
    >
      <MotifGraphic id={card.id} color={card.color} />
      <div className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted">{card.category}</p>
        <h2 className="font-display text-xl">{card.title}</h2>
        <p className="mt-1 line-clamp-2 text-sm text-muted">{text}</p>
      </div>
    </Link>
  );
}
