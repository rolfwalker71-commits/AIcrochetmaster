"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function LoginForm() {
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/access")
      .then((response) => response.json())
      .then((data: { configured?: boolean }) => setConfigured(Boolean(data.configured)))
      .catch(() => setConfigured(false));
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error || "Anmeldung fehlgeschlagen.");
      return;
    }
    const next = params.get("next") || "/";
    window.location.assign(next.startsWith("/") ? next : "/");
  };

  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle className="font-heading text-3xl">Zugang</CardTitle>
        <CardDescription id="login-hint">
          Die App ist geschützt. Passwort oder PIN eingeben.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(event) => void submit(event)} className="space-y-4">
          {configured === false && (
            <Alert>
              <AlertDescription>
                Kein <code>APP_PASSWORD</code> oder <code>APP_PIN</code> gesetzt. In der{" "}
                <code>.env</code> hinterlegen und den Container neu starten.
              </AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="login-password">Passwort / PIN</Label>
            <Input
              id="login-password"
              type="password"
              autoFocus
              autoComplete="current-password"
              enterKeyHint="done"
              aria-describedby={error ? "login-hint login-error" : "login-hint"}
              aria-invalid={Boolean(error)}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription id="login-error">{error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" size="lg" className="w-full">
            Eintreten
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
