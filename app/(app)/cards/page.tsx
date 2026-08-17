import { CardCatalog } from "@/components/card-catalog";
import { HELP_CARDS, MOTIF_CARDS } from "@/lib/cards";

export default function CardsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl">Motiv- und Hilfekarten</h1>
        <p className="text-sm text-muted-foreground">
          {MOTIF_CARDS.length} Motivkarten und {HELP_CARDS.length} Hilfekarten nur für Amigurumi —
          immer da, kein Import nötig.
        </p>
      </div>
      <CardCatalog />
    </div>
  );
}
