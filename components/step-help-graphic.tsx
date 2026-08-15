import { MotifGraphic } from "@/components/motif-graphic";
import type { CompanionMatch } from "@/lib/companion-cards";
import {
  STITCH_LABEL,
  expandSchemaMarks,
  parseStepSchema,
  type StitchKind,
} from "@/lib/step-schema";
import type { Step } from "@/lib/types";
import Link from "next/link";

const MARK: Record<StitchKind, string> = {
  lm: "○",
  km: "•",
  fm: "×",
  hstb: "⊤",
  stb: "T",
  dstb: "Ŧ",
  inc: "V",
  dec: "Λ",
};

export function StepHelpGraphic({
  step,
  companions,
  current,
}: {
  step: Step;
  companions: CompanionMatch[];
  current: boolean;
}) {
  const schema = parseStepSchema(step.instruction, step.stitchCount, step.roundLabel);
  if (!schema && companions.length === 0) return null;

  const marks = schema ? expandSchemaMarks(schema) : [];
  const summary = schema
    ? [
        schema.tokens.map((token) => `${token.count} ${STITCH_LABEL[token.kind]}`).join(", "),
        schema.repeat && schema.repeat > 1 ? `× ${schema.repeat}` : "",
      ]
        .filter(Boolean)
        .join(" ")
    : "";

  return (
    <div className="mt-3 space-y-2">
      {schema && marks.length > 0 && (
        <div
          className={`overflow-hidden rounded-2xl ${current ? "bg-terracotta-dark/40" : "bg-cream"}`}
          role="img"
          aria-label={summary || "Maschenschema"}
        >
          <SchemaCanvas marks={marks} layout={schema.layout} current={current} />
          {summary && (
            <p className={`px-3 pb-2 text-center text-[11px] ${current ? "text-cream/80" : "text-muted"}`}>
              {summary}
            </p>
          )}
        </div>
      )}
      {current && companions.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {companions.slice(0, 3).map((card) => (
            <Link
              key={card.id}
              href={card.href}
              className="w-28 shrink-0 overflow-hidden rounded-2xl bg-foam text-ink"
            >
              <MotifGraphic id={card.id} color={card.color} size="step" />
              <p className="px-2 py-1.5 text-center text-[11px] font-semibold leading-tight">{card.title}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function SchemaCanvas({
  marks,
  layout,
  current,
}: {
  marks: StitchKind[];
  layout: "round" | "row";
  current: boolean;
}) {
  const stroke = current ? "#FFF8EE" : "#C45C26";
  const width = 220;
  const height = layout === "round" ? 120 : 56;
  const cx = width / 2;
  const cy = 56;
  const radius = 38;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mx-auto h-auto w-full max-w-[240px]" aria-hidden>
      {layout === "round" && (
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke={stroke} strokeOpacity="0.35" strokeWidth="1.5" />
      )}
      {marks.map((kind, index) => {
        const point =
          layout === "round"
            ? polar(cx, cy, radius, (index / marks.length) * Math.PI * 2 - Math.PI / 2)
            : { x: 16 + (index * (width - 32)) / Math.max(marks.length - 1, 1), y: 28 };
        return (
          <text
            key={`${kind}-${index}`}
            x={point.x}
            y={point.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={stroke}
            fontSize={layout === "round" ? 13 : 16}
            fontWeight="700"
          >
            {MARK[kind]}
          </text>
        );
      })}
    </svg>
  );
}

function polar(cx: number, cy: number, radius: number, angle: number) {
  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius,
  };
}
