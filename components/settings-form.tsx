"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { apiPost } from "@/lib/api";
import { getSettings, saveSettings } from "@/lib/db";
import type { ImageModel, Settings, TextModel } from "@/lib/types";
import { Eye, EyeOff, LogOut } from "lucide-react";
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

  if (!settings) return <p className="text-muted-foreground">Einstellungen werden geladen …</p>;

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
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">OpenAI</CardTitle>
          <CardDescription>
            {serverKey
              ? "Der Key aus der Server-.env gilt automatisch. Hier nur eintragen, wenn du einen anderen Key nutzen willst."
              : "Kein Server-Key gefunden. Trage OPENAI_API_KEY in der .env ein oder optional hier einen Key für dieses Gerät."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="openai-key">Anderer API-Key (optional)</Label>
            <div className="flex gap-2">
              <Input
                id="openai-key"
                type={showKey ? "text" : "password"}
                autoComplete="off"
                value={settings.openaiKey}
                onChange={(event) => void update({ openaiKey: event.target.value.trim() })}
                placeholder={serverKey ? "leer = Server-Key" : "sk-…"}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={showKey ? "Key verbergen" : "Key zeigen"}
                onClick={() => setShowKey((value) => !value)}
              >
                {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
            </div>
          </div>
          <Button type="button" onClick={() => void testKey()}>
            Key testen
          </Button>
          {test && (
            <p className="text-sm text-muted-foreground" role="status">
              {test}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="text-model">Textmodell</Label>
            <Select
              value={settings.textModel}
              onValueChange={(value) => void update({ textModel: value as TextModel })}
            >
              <SelectTrigger id="text-model" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o">gpt-4o — empfohlen</SelectItem>
                <SelectItem value="gpt-4.1">gpt-4.1 — genauer bei langen Videos</SelectItem>
                <SelectItem value="gpt-4o-mini">gpt-4o-mini — günstiger Test</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="image-model">Bildmodell</Label>
            <Select
              value={settings.imageModel}
              onValueChange={(value) => void update({ imageModel: value as ImageModel })}
            >
              <SelectTrigger id="image-model" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-image-1">gpt-image-1</SelectItem>
                <SelectItem value="dall-e-3">dall-e-3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Werkstatt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex min-h-11 items-center justify-between gap-3">
            <Label htmlFor="row-counter">Reihenzähler standardmäßig zeigen</Label>
            <Switch
              id="row-counter"
              checked={settings.showRowCounter}
              onCheckedChange={(checked) => void update({ showRowCounter: checked })}
            />
          </div>
          <div className="flex min-h-11 items-center justify-between gap-3">
            <Label htmlFor="large-text">Große Schrift</Label>
            <Switch
              id="large-text"
              checked={settings.largeText}
              onCheckedChange={(checked) => void update({ largeText: checked })}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            In der Werkstatt kannst du den Zähler zusätzlich ein- und ausblenden. Der Stand bleibt
            gespeichert.
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Zugang</CardTitle>
          <CardDescription>
            Die App ist mit Passwort oder PIN geschützt. Anleitungen, Fortschritt und Werkstatt
            liegen auf dem Server und sind auf jedem Gerät gleich. Abmelden löscht nur das
            Zugangs-Cookie.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={async () => {
              await fetch("/api/logout", { method: "POST" });
              window.location.href = "/login";
            }}
          >
            <LogOut className="size-4" />
            Abmelden
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
