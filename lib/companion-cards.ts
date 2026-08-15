import { MOTIF_CARDS } from "./cards";
import type { MotifCard, Step } from "./types";

export interface CompanionMatch {
  id: string;
  title: string;
  hint: string;
  color: string;
  icon: CompanionIcon;
  href: string;
}

export type CompanionIcon =
  | "ring"
  | "chain"
  | "slip"
  | "sc"
  | "hdc"
  | "dc"
  | "inc"
  | "dec"
  | "color"
  | "sew"
  | "fill"
  | "flower"
  | "square";

interface Rule {
  id: string;
  icon: CompanionIcon;
  keywords: string[];
}

const RULES: Rule[] = [
  { id: "magischer-ring", icon: "ring", keywords: ["magischer ring", "magic ring", "zauberring"] },
  { id: "luftmaschenkette", icon: "chain", keywords: ["luftmaschenkette", "luftmasche", " lm ", "kette"] },
  { id: "kettmasche", icon: "slip", keywords: ["kettmasche", " km ", "schlussrunde"] },
  { id: "feste-masche", icon: "sc", keywords: ["feste masche", "festen maschen", " fm ", "fM"] },
  { id: "halbes-staebchen", icon: "hdc", keywords: ["halbes stäbchen", "halbe stäbchen", "hstb"] },
  { id: "doppelstaebchen", icon: "dc", keywords: ["doppelstäbchen", "dstb"] },
  { id: "staebchen", icon: "dc", keywords: ["stäbchen", " stb "] },
  { id: "zunahme", icon: "inc", keywords: ["zunahme", "zunehmen", "zun "] },
  { id: "abnahme", icon: "dec", keywords: ["abnahme", "abnehmen", "abn ", "unsichtbare"] },
  { id: "granny-square", icon: "square", keywords: ["granny"] },
  { id: "bluete", icon: "flower", keywords: ["blüte", "blume", "blatt"] },
  { id: "farbwechsel", icon: "color", keywords: ["farbwechsel", "neue farbe", "farbe wechsel"] },
  { id: "faeden-vernaehen-motiv", icon: "sew", keywords: ["vernähen", "annähen", "nähen"] },
  { id: "fuellen-motiv", icon: "fill", keywords: ["füllen", "stopfen", "füllwatte"] },
];

function matches(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => {
    const needle = keyword.toLowerCase();
    if (needle === "stäbchen" && (text.includes("halbes stäbchen") || text.includes("doppelstäbchen"))) {
      return text.replace(/halbes stäbchen/g, " ").replace(/doppelstäbchen/g, " ").includes(needle);
    }
    return text.includes(needle);
  });
}

export function companionCardsForText(text: string): CompanionMatch[] {
  const hay = ` ${text.toLowerCase()} `;
  const found: CompanionMatch[] = [];
  const seen = new Set<string>();

  for (const rule of RULES) {
    if (!matches(hay, rule.keywords) || seen.has(rule.id)) continue;
    const card = MOTIF_CARDS.find((item) => item.id === rule.id);
    if (!card) continue;
    seen.add(rule.id);
    found.push(toMatch(card, rule.icon));
  }

  return found;
}

export function companionCardsForStep(step: Pick<Step, "roundLabel" | "instruction" | "colorChange">): CompanionMatch[] {
  return companionCardsForText(`${step.roundLabel} ${step.instruction} ${step.colorChange ?? ""}`);
}

export function companionCardsForPattern(tags: string[], steps: Pick<Step, "roundLabel" | "instruction">[]): CompanionMatch[] {
  const fromSteps = steps.flatMap((step) => companionCardsForStep(step));
  const fromTags = companionCardsForText(tags.join(" "));
  const merged = [...fromTags, ...fromSteps];
  const unique = new Map(merged.map((card) => [card.id, card]));
  return [...unique.values()].slice(0, 8);
}

function toMatch(card: MotifCard, icon: CompanionIcon): CompanionMatch {
  return {
    id: card.id,
    title: card.title,
    hint: card.stitchHint || card.summary,
    color: card.color,
    icon,
    href: `/cards/motif/${card.id}`,
  };
}
