"use client";

import { apiPost } from "@/lib/api";
import { getSettings, saveSettings } from "@/lib/db";
import type { ImageModel, Settings, TextModel } from "@/lib/types";
import { useEffect, useState } from "react";

export function SettingsForm() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [test, setTest] = useState("");
  const [serverKey, setServerKey] = useState<boolean | null>(null);

  useEffect(() => {
    getSettings().then(setSettings);
    fetch("/api/access")
      .then((response) => response.json())
      .then((data: { openaiConfigured?: boolean }) => setServerKey(Boolean(data.openaiConfigured)))
      .catch(() => setServerKey(false));
  }, []);

  if (!settings) return <p className="text-muted">Einstellungen werden geladen …</p>;

  const update = async (partial: Partial<Settings>) => {
    const next = await saveSettings(partial);
    setSettings(next);
    document.body.classList.toggle("large-text", next.largeText);
  };

  const testKey = async () => {
    setTest("Prüfe …");
    try {
      await apiPost("/api/test-key", {}, settings);
      setTest("Key ist gültig.");
    } catch (error) {
      setTest(error instanceof Error ? error.message : "Key ungültig.");
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-3xl bg-foam p-4 card-shadow">
        <h2 className="font-display text-2xl">OpenAI</h2>
        <p className="mt-1 text-sm text-muted">
          {serverKey
            ? "Der Key aus der Server-.env gilt automatisch. Hier nur eintragen, wenn du einen anderen Key nutzen willst."
            : "Kein Server-Key gefunden. Trage OPENAI_API_KEY in der .env ein oder optional hier einen Key für dieses Gerät."}
        </p>
        <label className="mt-4 block space-y-1">
          <span className="text-xs uppercase tracking-wide text-muted">
            Anderer API-Key (optional)
          </span>
          <div className="flex gap-2">
            <input
              className="w-full rounded-2xl border border-line px-3 py-2"
              type={showKey ? "text" : "password"}
              autoComplete="off"
              value={settings.openaiKey}
              onChange={(event) => void update({ openaiKey: event.target.value.trim() })}
              placeholder={serverKey ? "leer = Server-Key" : "sk-…"}
            />
            <button
              type="button"
              className="min-h-11 min-w-11 rounded-2xl border border-line px-3 text-sm font-semibold"
              onClick={() => setShowKey((value) => !value)}
            >
              {showKey ? "Verbergen" : "Zeigen"}
            </button>
          </div>
        </label>
        <button
          type="button"
          onClick={() => void testKey()}
          className="mt-3 min-h-11 rounded-full bg-terracotta px-4 py-2 text-sm font-semibold text-white"
        >
          Key testen
        </button>
        {test && (
          <p className="mt-2 text-sm text-muted" role="status">
            {test}
          </p>
        )}

        <label className="mt-4 block space-y-1">
          <span className="text-xs uppercase tracking-wide text-muted">Textmodell</span>
          <select
            className="w-full rounded-2xl border border-line bg-foam px-3 py-2"
            value={settings.textModel}
            onChange={(event) => void update({ textModel: event.target.value as TextModel })}
          >
            <option value="gpt-4o">gpt-4o — empfohlen</option>
            <option value="gpt-4.1">gpt-4.1 — genauer bei langen Videos</option>
            <option value="gpt-4o-mini">gpt-4o-mini — günstiger Test</option>
          </select>
        </label>
        <label className="mt-3 block space-y-1">
          <span className="text-xs uppercase tracking-wide text-muted">Bildmodell</span>
          <select
            className="w-full rounded-2xl border border-line bg-foam px-3 py-2"
            value={settings.imageModel}
            onChange={(event) => void update({ imageModel: event.target.value as ImageModel })}
          >
            <option value="gpt-image-1">gpt-image-1</option>
            <option value="dall-e-3">dall-e-3</option>
          </select>
        </label>
      </section>

      <section className="rounded-3xl bg-foam p-4 card-shadow">
        <h2 className="font-display text-2xl">Werkstatt</h2>
        <label className="mt-3 flex min-h-11 items-center justify-between gap-3">
          <span>Reihenzähler standardmäßig zeigen</span>
          <input
            type="checkbox"
            checked={settings.showRowCounter}
            onChange={(event) => void update({ showRowCounter: event.target.checked })}
          />
        </label>
        <label className="mt-3 flex min-h-11 items-center justify-between gap-3">
          <span>Große Schrift</span>
          <input
            type="checkbox"
            checked={settings.largeText}
            onChange={(event) => void update({ largeText: event.target.checked })}
          />
        </label>
        <p className="mt-3 text-sm text-muted">
          In der Werkstatt kannst du den Zähler zusätzlich ein- und ausblenden. Der Stand bleibt
          gespeichert.
        </p>
      </section>

      <section className="rounded-3xl bg-foam p-4 card-shadow">
        <h2 className="font-display text-2xl">Zugang</h2>
        <p className="mt-1 text-sm text-muted">
          Die App ist mit Passwort oder PIN geschützt. Anleitungen, Fortschritt und Werkstatt
          liegen auf dem Server und sind auf jedem Gerät gleich. Abmelden löscht nur das
          Zugangs-Cookie.
        </p>
        <button
          type="button"
          className="mt-3 min-h-11 rounded-full border border-line px-4 py-2 text-sm font-semibold"
          onClick={async () => {
            await fetch("/api/logout", { method: "POST" });
            window.location.href = "/login";
          }}
        >
          Abmelden
        </button>
      </section>
    </div>
  );
}
