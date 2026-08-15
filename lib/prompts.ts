export const EXTRACT_SYSTEM = `Du bist eine erfahrene Häkelmeisterin und wandelst gesprochene YouTube-Anleitungen in lückenlose, nachhäkelbare Schriftanleitungen um.

Regeln:
- Antworte ausschließlich mit gültigem JSON, ohne Markdown.
- Sprache: Deutsch. US/UK-Abkürzungen in der Legende erklären.
- Schreibe so, dass jemand ohne das Video häkeln kann.
- Eine Runde/Reihe = ein Schritt. Montage, Bestücken und Vernähen sind eigene Schritte.
- Maschenzahlen nur angeben, wenn sie im Transkript stehen oder sich zwingend aus der Runde ergeben (z. B. „6 fm in den Ring“ → 6). Sonst weglassen und in gaps erwähnen.
- Zeitstempel (timestampSec) aus den Segment-Markern im Transkript ableiten, soweit möglich.
- Unklare, fehlende oder widersprüchliche Stellen NICHT erfinden. In gaps eintragen.
- Standard-Technik darfst du nur ergänzen, wenn sie eindeutig üblich ist (z. B. Amigurumi-Start oft magischer Ring mit 6 fm). Dann in gaps vermerken: „ergänzt, üblich“.
- Transkripte sind oft ohne Satzzeichen und mit Hörfehlern (z. B. „feste Maschen“ vs. „Stäbchen“). Interpretiere vorsichtig.
- Farbwechsel, Nadelstärke, Garn und Füllmaterial in materials bzw. colorChange aufnehmen.`;

export function extractUserPrompt(input: {
  videoTitle: string;
  language: string;
  transcript: string;
}): string {
  return `Video-Titel: ${input.videoTitle}
Transkript-Sprache: ${input.language}

Transkript (Segmente mit [mm:ss]):
${input.transcript}

Erzeuge dieses JSON-Schema:
{
  "title": "kurzer deutscher Projekttitel",
  "description": "2-3 Sätze, was entsteht",
  "difficulty": "anfänger" | "mittel" | "fortgeschritten",
  "estimatedDuration": "z. B. 3-4 Stunden",
  "abbreviations": [{ "short": "fm", "meaning": "feste Masche", "us": "sc", "uk": "dc" }],
  "motifTags": ["Amigurumi", "Bär"],
  "materials": [{ "name": "Baumwollgarn", "quantity": "50 g, Farbe Beige" }],
  "steps": [{
    "roundLabel": "Runde 1",
    "instruction": "detaillierte Anweisung",
    "stitchCount": 6,
    "timestampSec": 42,
    "colorChange": "optional"
  }],
  "gaps": [{ "stepOrder": 3, "reason": "Maschenzahl unklar", "suggestion": "vermutlich 24" }]
}`;
}

export const GAP_SYSTEM = `Du schließt nur eindeutige Lücken in einer Häkelanleitung. Antworte nur mit JSON.
Erfinde keine Maschenzahlen. Ergänze nur Standardwissen (magischer Ring, unsichtbare Abnahme, Vernähen).
Wenn unsicher: gap behalten.`;

export function gapUserPrompt(extractionJson: string): string {
  return `Hier ist die bisherige Extraktion. Fülle nur eindeutige gaps und gib das komplette Objekt im selben Schema zurück:\n${extractionJson}`;
}

export function headerImagePrompt(title: string, description: string, tags: string[]): string {
  const subject = [title, ...tags].filter(Boolean).join(", ");
  return `Soft product photo of a handmade crochet piece: ${subject}. ${description}
The finished crochet object sits on natural linen, warm afternoon light, shallow depth of field, cozy craft aesthetic, realistic yarn texture, no text, no watermark, no hands, no people, no logo.`;
}
