import type { CompanionIcon, CompanionMatch } from "@/lib/companion-cards";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export function CompanionStrip({
  cards,
  title = "Begleitkarten",
}: {
  cards: CompanionMatch[];
  title?: string;
}) {
  if (cards.length === 0) return null;

  return (
    <section className="space-y-2">
      <h3 className="font-heading text-xl">{title}</h3>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {cards.map((card) => (
          <CompanionCard key={card.id} card={card} />
        ))}
      </div>
    </section>
  );
}

export function CompanionCard({ card }: { card: CompanionMatch }) {
  return (
    <Link href={card.href} className="w-36 shrink-0">
      <Card className="overflow-hidden rounded-3xl py-0">
        <div
          className="flex h-24 items-center justify-center text-primary-foreground"
          style={{ background: card.color }}
        >
          <CompanionIconMark icon={card.icon} />
        </div>
        <CardHeader className="p-3">
          <CardTitle className="font-heading text-sm leading-tight">{card.title}</CardTitle>
          <CardDescription className="line-clamp-2 text-[11px]">{card.hint}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}

function CompanionIconMark({ icon }: { icon: CompanionIcon }) {
  const common = {
    viewBox: "0 0 64 64",
    className: "size-14",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 3,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (icon) {
    case "ring":
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="18" />
          <circle cx="32" cy="32" r="7" />
        </svg>
      );
    case "chain":
      return (
        <svg {...common}>
          <ellipse cx="20" cy="32" rx="9" ry="12" />
          <ellipse cx="32" cy="32" rx="9" ry="12" />
          <ellipse cx="44" cy="32" rx="9" ry="12" />
        </svg>
      );
    case "slip":
      return (
        <svg {...common}>
          <path d="M14 40c8-16 28-16 36 0" />
          <path d="M44 28l8 12" />
        </svg>
      );
    case "sc":
      return (
        <svg {...common}>
          <path d="M18 48 L32 16 L46 48" />
          <path d="M24 36h16" />
        </svg>
      );
    case "hdc":
      return (
        <svg {...common}>
          <path d="M18 50 L32 12 L46 50" />
          <path d="M26 28h12" />
        </svg>
      );
    case "dc":
      return (
        <svg {...common}>
          <path d="M32 10v36" />
          <path d="M20 22h24" />
          <path d="M18 50h28" />
        </svg>
      );
    case "inc":
      return (
        <svg {...common}>
          <path d="M32 50 V18" />
          <path d="M32 22 L16 10" />
          <path d="M32 22 L48 10" />
        </svg>
      );
    case "dec":
      return (
        <svg {...common}>
          <path d="M16 12 L32 28 L48 12" />
          <path d="M32 28v24" />
        </svg>
      );
    case "color":
      return (
        <svg {...common}>
          <circle cx="24" cy="30" r="10" />
          <circle cx="40" cy="34" r="10" />
        </svg>
      );
    case "sew":
      return (
        <svg {...common}>
          <path d="M16 40c8-8 8-8 16 0s8 8 16 0" />
          <path d="M48 20l-6 8" />
        </svg>
      );
    case "fill":
      return (
        <svg {...common}>
          <path d="M16 28h32v20H16z" />
          <path d="M22 28 V18 h20 v10" />
        </svg>
      );
    case "flower":
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="6" />
          <circle cx="32" cy="16" r="6" />
          <circle cx="32" cy="48" r="6" />
          <circle cx="16" cy="32" r="6" />
          <circle cx="48" cy="32" r="6" />
        </svg>
      );
    case "square":
      return (
        <svg {...common}>
          <rect x="14" y="14" width="36" height="36" rx="4" />
          <rect x="24" y="24" width="16" height="16" rx="2" />
        </svg>
      );
    default:
      return <span className="text-3xl">*</span>;
  }
}
