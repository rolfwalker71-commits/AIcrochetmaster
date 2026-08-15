import type { ReactNode } from "react";

const STROKE = "#FFF8EE";
const YARN = "#F4EAD8";

function Svg({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 160 110"
      className={className ?? "h-full w-full"}
      fill="none"
      stroke={STROKE}
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

const GRAPHICS: Record<string, ReactNode> = {
  "magischer-ring": (
    <Svg>
      <circle cx="80" cy="58" r="28" />
      <circle cx="80" cy="58" r="10" />
      <path d="M80 30 A28 28 0 0 1 108 58" />
      <path d="M52 46c8 4 12 10 12 18" />
      <path d="M108 70c-8 6-16 10-28 10" />
      <path d="M118 38c8-10 18-14 26-12" />
    </Svg>
  ),
  luftmaschenkette: (
    <Svg>
      <ellipse cx="34" cy="58" rx="14" ry="18" />
      <ellipse cx="58" cy="58" rx="14" ry="18" />
      <ellipse cx="82" cy="58" rx="14" ry="18" />
      <ellipse cx="106" cy="58" rx="14" ry="18" />
      <ellipse cx="130" cy="58" rx="14" ry="18" />
    </Svg>
  ),
  wendeluftmaschen: (
    <Svg>
      <path d="M24 78h88" />
      <path d="M112 78c0-28-8-40-28-48" />
      <path d="M84 30h-8" />
      <path d="M24 62h70" />
      <path d="M24 46h48" />
    </Svg>
  ),
  kettmasche: (
    <Svg>
      <path d="M28 72c20-28 56-28 76 0" />
      <path d="M92 40l20 24" />
      <circle cx="88" cy="38" r="5" fill={YARN} stroke="none" />
    </Svg>
  ),
  "feste-masche": (
    <Svg>
      <path d="M40 88 L80 22 L120 88" />
      <path d="M56 62h48" />
    </Svg>
  ),
  "halbes-staebchen": (
    <Svg>
      <path d="M40 90 L80 18 L120 90" />
      <path d="M58 48h44" />
      <path d="M80 18v22" />
    </Svg>
  ),
  staebchen: (
    <Svg>
      <path d="M80 16v68" />
      <path d="M52 34h56" />
      <path d="M44 88h72" />
    </Svg>
  ),
  doppelstaebchen: (
    <Svg>
      <path d="M80 12v72" />
      <path d="M50 28h60" />
      <path d="M50 44h60" />
      <path d="M40 90h80" />
    </Svg>
  ),
  zunahme: (
    <Svg>
      <path d="M80 92 V36" />
      <path d="M80 40 L46 16" />
      <path d="M80 40 L114 16" />
      <path d="M46 16h-8" />
      <path d="M114 16h8" />
    </Svg>
  ),
  abnahme: (
    <Svg>
      <path d="M40 20 L80 48 L120 20" />
      <path d="M80 48v44" />
    </Svg>
  ),
  "unsichtbare-abnahme-motiv": (
    <Svg>
      <path d="M36 28c16 8 28 8 44 0" />
      <path d="M80 28c16 8 28 8 44 0" />
      <path d="M80 36v48" />
      <path d="M62 84h36" />
    </Svg>
  ),
  "granny-square": (
    <Svg>
      <rect x="36" y="18" width="88" height="78" rx="6" />
      <rect x="56" y="36" width="48" height="42" rx="3" />
      <path d="M36 40h20" />
      <path d="M104 40h20" />
      <path d="M36 74h20" />
      <path d="M104 74h20" />
    </Svg>
  ),
  "granny-streifen": (
    <Svg>
      <path d="M22 28h116" />
      <path d="M22 50h116" />
      <path d="M22 72h116" />
      <path d="M38 28v44" />
      <path d="M80 28v44" />
      <path d="M122 28v44" />
    </Svg>
  ),
  cluster: (
    <Svg>
      <path d="M48 88 L80 24" />
      <path d="M80 88 L80 24" />
      <path d="M112 88 L80 24" />
      <path d="M58 70h44" />
    </Svg>
  ),
  popcorn: (
    <Svg>
      <ellipse cx="80" cy="40" rx="22" ry="18" />
      <path d="M62 50c4 22 32 22 36 0" />
      <path d="M80 58v28" />
    </Svg>
  ),
  reliefmaschen: (
    <Svg>
      <path d="M40 88c0-40 16-64 40-64s40 24 40 64" />
      <path d="M56 70c8-18 40-18 48 0" />
    </Svg>
  ),
  bluete: (
    <Svg>
      <circle cx="80" cy="56" r="8" fill={YARN} stroke="none" />
      <circle cx="80" cy="28" r="12" />
      <circle cx="80" cy="84" r="12" />
      <circle cx="52" cy="56" r="12" />
      <circle cx="108" cy="56" r="12" />
    </Svg>
  ),
  blatt: (
    <Svg>
      <path d="M80 92c-28-20-36-48-8-72 4 20 16 28 16 28s12-8 16-28c28 24 20 52-8 72" />
      <path d="M80 88 V28" />
    </Svg>
  ),
  herz: (
    <Svg>
      <path d="M80 90c-36-24-44-48-20-64 12-8 20 4 20 4s8-12 20-4c24 16 16 40-20 64z" />
    </Svg>
  ),
  stern: (
    <Svg>
      <path d="M80 16 L90 48 L124 48 L96 68 L106 100 L80 80 L54 100 L64 68 L36 48 L70 48 Z" />
    </Svg>
  ),
  spirale: (
    <Svg>
      <path d="M80 56c0-8 8-12 16-8s8 20-4 28-28 4-32-12 12-36 32-36 40 20 36 44-28 40-52 32" />
    </Svg>
  ),
  "amigurumi-kopf": (
    <Svg>
      <circle cx="80" cy="52" r="30" />
      <circle cx="68" cy="48" r="4" fill={YARN} stroke="none" />
      <circle cx="92" cy="48" r="4" fill={YARN} stroke="none" />
      <path d="M70 66c6 8 14 8 20 0" />
    </Svg>
  ),
  "amigurumi-koerper": (
    <Svg>
      <ellipse cx="80" cy="62" rx="26" ry="34" />
      <path d="M62 40c8-16 28-16 36 0" />
    </Svg>
  ),
  "amigurumi-bein": (
    <Svg>
      <path d="M68 18c-6 8-8 20-6 36 2 18 2 28 8 40" />
      <path d="M92 18c6 8 8 20 6 36-2 18-2 28-8 40" />
      <path d="M62 54h36" />
      <ellipse cx="70" cy="96" rx="10" ry="6" />
      <ellipse cx="90" cy="96" rx="10" ry="6" />
    </Svg>
  ),
  "amigurumi-arm": (
    <Svg>
      <path d="M40 28c20 8 28 28 24 52" />
      <path d="M120 28c-20 8-28 28-24 52" />
      <circle cx="38" cy="24" r="8" />
      <circle cx="122" cy="24" r="8" />
    </Svg>
  ),
  schnauze: (
    <Svg>
      <ellipse cx="80" cy="62" rx="36" ry="24" />
      <circle cx="80" cy="54" r="5" fill={YARN} stroke="none" />
      <path d="M80 60v14" />
      <path d="M68 78c8 6 16 6 24 0" />
    </Svg>
  ),
  ohren: (
    <Svg>
      <circle cx="80" cy="70" r="22" />
      <ellipse cx="52" cy="36" rx="14" ry="18" />
      <ellipse cx="108" cy="36" rx="14" ry="18" />
    </Svg>
  ),
  farbwechsel: (
    <Svg>
      <circle cx="62" cy="56" r="22" />
      <circle cx="98" cy="56" r="22" />
      <path d="M80 34v44" />
    </Svg>
  ),
  "faeden-vernaehen-motiv": (
    <Svg>
      <path d="M28 70c16-16 16-16 32 0s16 16 32 0 16-16 32 0" />
      <path d="M124 38l-12 16" />
      <circle cx="128" cy="34" r="4" fill={YARN} stroke="none" />
    </Svg>
  ),
  "fuellen-motiv": (
    <Svg>
      <path d="M48 40h64v48H48z" />
      <path d="M58 40V28h44v12" />
      <path d="M64 58h32" />
      <path d="M64 70h24" />
    </Svg>
  ),
  "gliedmassen-annaehen-motiv": (
    <Svg>
      <circle cx="80" cy="36" r="16" />
      <ellipse cx="80" cy="78" rx="20" ry="22" />
      <path d="M60 70c-16 4-22 16-18 28" />
      <path d="M100 70c16 4 22 16 18 28" />
    </Svg>
  ),
  picot: (
    <Svg>
      <path d="M28 78h40" />
      <path d="M68 78c0-28 24-28 24 0" />
      <path d="M92 78h40" />
    </Svg>
  ),
  "vorderes-hinteres-glied": (
    <Svg>
      <path d="M36 40c16-16 36-16 52 0" />
      <path d="M36 72c16 16 36 16 52 0" />
      <path d="M62 48c6 8 14 8 20 0" />
    </Svg>
  ),
  "us-uk-abkuerzungen": (
    <Svg>
      <rect x="28" y="28" width="44" height="54" rx="6" />
      <rect x="88" y="28" width="44" height="54" rx="6" />
      <path d="M40 48h20" />
      <path d="M100 48h20" />
      <path d="M40 64h16" />
      <path d="M100 64h16" />
    </Svg>
  ),
  "deutsche-abkuerzungen": (
    <Svg>
      <path d="M48 28h28c16 0 16 24 0 24H48z" />
      <path d="M48 52h32c16 0 16 28 0 28H48z" />
    </Svg>
  ),
  "wiederholungen-lesen": (
    <Svg>
      <path d="M36 40l8 12 8-12" />
      <path d="M108 40l8 12 8-12" />
      <path d="M58 70h44" />
      <path d="M70 56h20" />
    </Svg>
  ),
  maschenprobe: (
    <Svg>
      <rect x="40" y="22" width="80" height="70" />
      <path d="M40 40h80" />
      <path d="M40 58h80" />
      <path d="M40 76h80" />
      <path d="M60 22v70" />
      <path d="M80 22v70" />
      <path d="M100 22v70" />
    </Svg>
  ),
  nadelwahl: (
    <Svg>
      <path d="M36 78 L118 28" />
      <path d="M118 28c8-4 14 4 8 12" />
      <circle cx="40" cy="80" r="6" />
    </Svg>
  ),
  garnstaerken: (
    <Svg>
      <circle cx="44" cy="62" r="14" />
      <circle cx="80" cy="56" r="20" />
      <circle cx="118" cy="50" r="26" />
    </Svg>
  ),
  "garn-ersetzen": (
    <Svg>
      <circle cx="50" cy="56" r="18" />
      <circle cx="110" cy="56" r="18" />
      <path d="M70 44h20" />
      <path d="M82 36l8 8-8 8" />
      <path d="M90 68H70" />
      <path d="M78 60l-8 8 8 8" />
    </Svg>
  ),
  "reihen-lesen": (
    <Svg>
      <path d="M28 36h104" />
      <path d="M132 36c0 16-8 16-16 16" />
      <path d="M116 52H28" />
      <path d="M28 52c0 16 8 16 16 16" />
      <path d="M44 68h88" />
    </Svg>
  ),
  "runden-lesen": (
    <Svg>
      <circle cx="80" cy="56" r="30" />
      <circle cx="80" cy="56" r="14" />
      <path d="M80 26v12" />
    </Svg>
  ),
  "spirale-oder-schlussrunde": (
    <Svg>
      <path d="M48 70c0-20 12-32 28-32s24 10 24 22" />
      <circle cx="112" cy="56" r="18" />
    </Svg>
  ),
  "maschen-zaehlen": (
    <Svg>
      <path d="M40 40h20" />
      <path d="M50 30v20" />
      <path d="M78 32v28" />
      <path d="M70 46h16" />
      <path d="M108 32h16l-16 28h16" />
    </Svg>
  ),
  "markierer-setzen": (
    <Svg>
      <path d="M80 22v36" />
      <path d="M80 58l-16 28h32z" />
      <circle cx="80" cy="22" r="8" />
    </Svg>
  ),
  "amirugumi-rund": (
    <Svg>
      <circle cx="52" cy="56" r="24" />
      <path d="M96 32h28v48H96z" />
    </Svg>
  ),
  "kein-loch-im-ring": (
    <Svg>
      <circle cx="80" cy="56" r="28" />
      <circle cx="80" cy="56" r="8" />
      <path d="M68 44l24 24" />
    </Svg>
  ),
  "zu-wenige-maschen": (
    <Svg>
      <path d="M36 56h88" />
      <path d="M80 34v44" />
      <path d="M36 56h0" />
      <path d="M50 40 L36 56 L50 72" />
    </Svg>
  ),
  "zu-viele-maschen": (
    <Svg>
      <path d="M36 56h88" />
      <path d="M80 28v56" />
    </Svg>
  ),
  "loecher-im-stoff": (
    <Svg>
      <rect x="32" y="24" width="96" height="64" rx="6" />
      <circle cx="62" cy="50" r="8" />
      <circle cx="98" cy="64" r="10" />
    </Svg>
  ),
  "zu-fest-haekeln": (
    <Svg>
      <path d="M40 36c8 28 16 28 24 0" />
      <path d="M68 36c8 28 16 28 24 0" />
      <path d="M96 36c8 28 16 28 24 0" />
    </Svg>
  ),
  "kanten-gerade": (
    <Svg>
      <path d="M36 28l20 56" />
      <path d="M104 28v56" />
      <path d="M36 84h88" />
    </Svg>
  ),
  "unsichtbare-abnahme": (
    <Svg>
      <path d="M36 28c16 8 28 8 44 0" />
      <path d="M80 28c16 8 28 8 44 0" />
      <path d="M80 36v48" />
    </Svg>
  ),
  "faeden-vernaehen": (
    <Svg>
      <path d="M28 70c16-16 16-16 32 0s16 16 32 0 16-16 32 0" />
      <path d="M124 38l-12 16" />
    </Svg>
  ),
  fuellen: (
    <Svg>
      <path d="M48 40h64v48H48z" />
      <path d="M58 40V28h44v12" />
    </Svg>
  ),
  "gliedmassen-annaehen": (
    <Svg>
      <circle cx="80" cy="36" r="16" />
      <ellipse cx="80" cy="78" rx="20" ry="22" />
      <path d="M60 70c-16 4-22 16-18 28" />
    </Svg>
  ),
  "augen-sicherheit": (
    <Svg>
      <ellipse cx="80" cy="56" rx="36" ry="22" />
      <circle cx="80" cy="56" r="10" fill={YARN} stroke="none" />
      <path d="M118 24l8 14h-16z" />
    </Svg>
  ),
  "kleine-teile": (
    <Svg>
      <circle cx="56" cy="56" r="22" />
      <circle cx="108" cy="56" r="10" />
      <path d="M124 28l6 12h-12z" />
    </Svg>
  ),
  "draht-sicherheit": (
    <Svg>
      <path d="M28 70c20-40 40-40 52 0s32 28 52-8" />
      <path d="M124 28l6 12h-12z" />
    </Svg>
  ),
  waschen: (
    <Svg>
      <path d="M50 36h60l-8 48H58z" />
      <path d="M64 28h32" />
      <path d="M70 56c4 8 16 8 20 0" />
    </Svg>
  ),
  "formen-blocken": (
    <Svg>
      <rect x="40" y="30" width="80" height="54" />
      <path d="M52 30v-10" />
      <path d="M80 30v-10" />
      <path d="M108 30v-10" />
    </Svg>
  ),
  "maschenprobe-amirugumi": (
    <Svg>
      <rect x="44" y="26" width="72" height="60" />
      <path d="M44 41h72" />
      <path d="M44 56h72" />
      <path d="M44 71h72" />
      <path d="M62 26v60" />
      <path d="M80 26v60" />
      <path d="M98 26v60" />
    </Svg>
  ),
  "video-tempo": (
    <Svg>
      <rect x="32" y="28" width="96" height="56" rx="8" />
      <path d="M70 44l24 12-24 12z" fill={YARN} stroke="none" />
    </Svg>
  ),
  "linke-haender": (
    <Svg>
      <path d="M52 28v56" />
      <path d="M52 28h28" />
      <path d="M108 28v56" />
      <path d="M108 28H80" />
      <path d="M70 72h20" />
    </Svg>
  ),
  "spannung-halten": (
    <Svg>
      <path d="M24 56c12-16 20-16 32 0s20 16 32 0 20-16 32 0 12 8 16 8" />
    </Svg>
  ),
  "anleitung-pruefen": (
    <Svg>
      <rect x="44" y="22" width="72" height="70" rx="6" />
      <path d="M58 44h32" />
      <path d="M58 60h32" />
      <path d="M58 76l10 8 18-20" />
    </Svg>
  ),
  "nadel-verlieren": (
    <Svg>
      <ellipse cx="70" cy="40" rx="16" ry="12" />
      <path d="M86 44c16 8 28 28 20 40" />
      <path d="M36 78 L118 40" />
    </Svg>
  ),
  auftrennen: (
    <Svg>
      <path d="M28 40c16 0 16 16 32 16s16-16 32-16 16 16 32 16" />
      <path d="M28 64c16 0 16 16 32 16s16-16 32-16" />
    </Svg>
  ),
  generic: (
    <Svg>
      <circle cx="80" cy="56" r="26" />
      <path d="M80 40v20" />
      <circle cx="80" cy="72" r="3" fill={YARN} stroke="none" />
    </Svg>
  ),
};

export function MotifGraphic({
  id,
  color,
  size = "list",
}: {
  id: string;
  color: string;
  size?: "list" | "detail";
}) {
  const graphic = GRAPHICS[id] ?? GRAPHICS.generic;
  return (
    <div
      className={`flex items-center justify-center ${size === "detail" ? "h-44" : "h-28"}`}
      style={{ background: color }}
      role="img"
      aria-label="Hilfsgrafik"
    >
      <div className={size === "detail" ? "h-36 w-56" : "h-24 w-40"}>{graphic}</div>
    </div>
  );
}
