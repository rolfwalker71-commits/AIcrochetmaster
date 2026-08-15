"use client";

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
    <form onSubmit={(event) => void submit(event)} className="rounded-3xl bg-foam p-5 card-shadow">
      <p className="font-display text-3xl">Zugang</p>
      <p className="mt-2 text-sm text-muted">
        Die App ist geschützt. Passwort oder PIN eingeben.
      </p>
      {configured === false && (
        <p className="mt-3 rounded-2xl bg-rose/10 px-3 py-2 text-sm">
          Kein <code>APP_PASSWORD</code> oder <code>APP_PIN</code> gesetzt. In der{" "}
          <code>.env</code> hinterlegen und den Container neu starten.
        </p>
      )}
      <label className="mt-4 block space-y-1">
        <span className="text-xs uppercase tracking-wide text-muted">Passwort / PIN</span>
        <input
          className="w-full rounded-2xl border border-line px-3 py-3"
          type="password"
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      {error && <p className="mt-3 text-sm text-terracotta-dark">{error}</p>}
      <button
        type="submit"
        className="mt-4 w-full rounded-full bg-terracotta py-3 font-semibold text-white"
      >
        Eintreten
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
