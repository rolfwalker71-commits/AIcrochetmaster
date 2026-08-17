import { CardCatalog } from "@/components/card-catalog";

export default function CardsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl">Motiv- und Hilfekarten</h1>
        <p className="text-sm text-muted-foreground">
          32 Motivkarten und 36 Hilfekarten — immer da, kein Import nötig.
        </p>
      </div>
      <CardCatalog />
    </div>
  );
}
