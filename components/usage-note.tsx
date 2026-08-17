import { formatTokenCount, formatUsd, totalUsd, type AnalysisUsage } from "@/lib/usage";

export function UsageNote({ usage }: { usage: AnalysisUsage }) {
  const prefix = usage.estimated ? "Schätzung" : "Analyse";
  return (
    <p className="mt-3 rounded-2xl bg-muted/70 px-3 py-2 text-xs text-muted-foreground">
      {prefix} · {formatTokenCount(usage.inputTokens)} Token rein ·{" "}
      {formatTokenCount(usage.outputTokens)} Token raus
      {usage.calls > 0 ? ` · ${usage.calls} Aufruf${usage.calls === 1 ? "" : "e"}` : ""}
      {" · "}
      ca. {formatUsd(totalUsd(usage))}
      {usage.imageUsd != null ? ` (davon Bild ${formatUsd(usage.imageUsd)})` : ""}
      . Ungefähr, laut Listenpreis, ohne Rabatte.
    </p>
  );
}
