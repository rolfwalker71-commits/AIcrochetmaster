"use client";

import { db, getSettings } from "@/lib/db";
import { startLibrarySync } from "@/lib/sync";
import { RegisterSW } from "@/components/register-sw";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const NAV = [
  { href: "/", label: "Bibliothek", icon: "⌂" },
  { href: "/import", label: "Import", icon: "+" },
  { href: "/cards", label: "Motive", icon: "◈" },
  { href: "/settings", label: "Mehr", icon: "⚙" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const locked = pathname === "/login";

  useEffect(() => {
    const apply = async () => {
      const settings = await getSettings();
      document.body.classList.toggle("large-text", settings.largeText);
    };
    void apply();
    const interval = window.setInterval(apply, 1500);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    void db.open();
    if (!locked) startLibrarySync();
  }, [locked]);

  return (
    <div className={`mx-auto flex min-h-dvh max-w-lg flex-col px-4 pt-6 ${locked ? "pb-8" : "pb-32"}`}>
      <a href="#inhalt" className="skip-link">
        Zum Inhalt
      </a>
      <RegisterSW />
      <header className="mb-6 flex items-end justify-between">
        <Link href={locked ? "/login" : "/"} className="flex min-h-12 items-center gap-3 rounded-2xl">
          <img
            src="/icons/app.png"
            alt=""
            width={48}
            height={48}
            className="h-12 w-12 shrink-0 object-contain"
          />
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-terracotta">AIcrochetmaster</p>
            <p className="font-display text-3xl font-semibold tracking-tight">Häkelmeister</p>
          </div>
        </Link>
        {!locked && (
          <div className="flex shrink-0 gap-2">
            <Link
              href="/import?kind=video"
              aria-label="Video importieren"
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-terracotta text-white"
            >
              <VideoGlyph />
            </Link>
            <Link
              href="/import?kind=pdf"
              aria-label="PDF importieren"
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-terracotta text-white"
            >
              <PdfGlyph />
            </Link>
          </div>
        )}
      </header>
      <main id="inhalt" className="flex-1">
        {children}
      </main>
      {!locked && (
      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-line bg-foam/95 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur"
        aria-label="Hauptnavigation"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-4 gap-1 px-2 pt-3">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 ${
                    active ? "bg-terracotta text-white" : "text-ink"
                  }`}
                >
                  <span className="text-3xl font-bold leading-none" aria-hidden>
                    {item.icon}
                  </span>
                  <span className="text-sm font-bold leading-tight">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      )}
    </div>
  );
}

function VideoGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden>
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h7A2.5 2.5 0 0 1 16 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 4 17.5v-11Z" />
      <path d="M17 9.2 21 7v10l-4-2.2V9.2Z" />
    </svg>
  );
}

function PdfGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M7 3h7l5 5v13H7z" />
      <path d="M14 3v5h5" />
      <path d="M9 14h6M9 18h4" />
    </svg>
  );
}
