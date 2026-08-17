"use client";

import { RegisterSW } from "@/components/register-sw";
import { Button } from "@/components/ui/button";
import { db, getSettings } from "@/lib/db";
import { startLibrarySync } from "@/lib/sync";
import { BookOpen, FileText, Library, Plus, Settings, Video } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const NAV = [
  { href: "/", label: "Bibliothek", icon: Library },
  { href: "/import", label: "Import", icon: Plus },
  { href: "/cards", label: "Motive", icon: BookOpen },
  { href: "/settings", label: "Mehr", icon: Settings },
] as const;

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
    <div className={`mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pt-6 sm:px-6 ${locked ? "pb-8" : "pb-32"}`}>
      <a href="#inhalt" className="skip-link">
        Zum Inhalt
      </a>
      <RegisterSW />
      <header className="mb-6 flex items-end justify-between gap-3">
        <Link href={locked ? "/login" : "/"} className="flex min-h-12 items-center gap-3 rounded-2xl">
          <img
            src="/icons/app.png"
            alt=""
            width={48}
            height={48}
            className="size-12 shrink-0 object-contain"
          />
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-primary">Amigurumi</p>
            <p className="font-heading text-3xl font-semibold tracking-tight">Häkelmeister</p>
          </div>
        </Link>
        {!locked && (
          <div className="flex shrink-0 gap-2">
            <Button asChild size="icon" aria-label="Video importieren">
              <Link href="/import?kind=video">
                <Video className="size-5" />
              </Link>
            </Button>
            <Button asChild size="icon" aria-label="PDF importieren">
              <Link href="/import?kind=pdf">
                <FileText className="size-5" />
              </Link>
            </Button>
          </div>
        )}
      </header>
      <main id="inhalt" className="flex-1">
        {children}
      </main>
      {!locked && (
        <nav
          className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur"
          aria-label="Hauptnavigation"
        >
          <ul className="mx-auto grid max-w-lg grid-cols-4 gap-1 px-2 pt-3">
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Button
                    asChild
                    variant={active ? "default" : "ghost"}
                    className="h-14 w-full flex-col gap-1 rounded-2xl px-2 py-2"
                    aria-current={active ? "page" : undefined}
                  >
                    <Link href={item.href}>
                      <Icon className="size-6" aria-hidden />
                      <span className="text-sm font-bold leading-tight">{item.label}</span>
                    </Link>
                  </Button>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}
