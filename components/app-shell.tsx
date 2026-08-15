"use client";

import { db, getSettings } from "@/lib/db";
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
  }, []);

  return (
    <div className={`mx-auto flex min-h-dvh max-w-lg flex-col px-4 pt-6 ${locked ? "pb-8" : "pb-28"}`}>
      {!locked && <RegisterSW />}
      <header className="mb-6 flex items-end justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/icons/app.png"
            alt=""
            width={48}
            height={48}
            className="h-12 w-12 shrink-0 object-contain"
          />
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-terracotta">AIcrochetmaster</p>
            <h1 className="font-display text-3xl font-semibold tracking-tight">Häkelmeister</h1>
          </div>
        </div>
        {!locked && (
          <Link
            href="/import"
            className="rounded-full bg-terracotta px-3 py-1.5 text-sm font-semibold text-white"
          >
            Video holen
          </Link>
        )}
      </header>
      <main className="flex-1">{children}</main>
      {!locked && (
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-foam/95 backdrop-blur">
        <ul className="mx-auto grid max-w-lg grid-cols-4 px-2 py-2">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex flex-col items-center gap-0.5 rounded-2xl px-2 py-2 text-xs ${
                    active ? "bg-cream text-terracotta" : "text-muted"
                  }`}
                >
                  <span className="text-lg leading-none">{item.icon}</span>
                  {item.label}
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
