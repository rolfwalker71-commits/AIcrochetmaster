import helpCards from "@/data/help-cards.json";
import motifCards from "@/data/motif-cards.json";
import type { HelpCard, MotifCard } from "./types";

export const MOTIF_CARDS = motifCards as MotifCard[];
export const HELP_CARDS = helpCards as HelpCard[];

export function getMotifCard(id: string): MotifCard | undefined {
  return MOTIF_CARDS.find((card) => card.id === id);
}

export function getHelpCard(id: string): HelpCard | undefined {
  return HELP_CARDS.find((card) => card.id === id);
}

export function uniqueCategories(cards: { category: string }[]): string[] {
  return [...new Set(cards.map((card) => card.category))];
}
