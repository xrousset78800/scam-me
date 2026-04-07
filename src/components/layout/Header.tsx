"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-white text-lg tracking-tight">
          <span className="text-accent">⚔</span>
          <span>Scam.me</span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted">
          <Link href="/trade" className="hover:text-white transition-colors">
            Échanger
          </Link>
          <Link href="/inventory" className="hover:text-white transition-colors">
            Inventaire
          </Link>
          <Link href="/history" className="hover:text-white transition-colors">
            Historique
          </Link>
        </nav>

        {/* Auth */}
        <div className="flex items-center gap-3">
          {session ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {session.user?.image && (
                  <Image
                    src={session.user.image}
                    alt={session.user.name ?? ""}
                    width={28}
                    height={28}
                    className="rounded-full"
                  />
                )}
                <span className="text-sm text-white hidden sm:block">{session.user?.name}</span>
              </div>
              <button
                onClick={() => signOut()}
                className="text-xs text-muted hover:text-white transition-colors"
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn("steam")}
              className={cn(
                "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium",
                "bg-[#1b2838] text-white hover:bg-[#2a3f5f] border border-[#4c6b8a] transition-colors"
              )}
            >
              <SteamIcon />
              Connexion Steam
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function SteamIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 27 27" fill="currentColor">
      <path d="M13.5 0C6.04 0 0 6.04 0 13.5c0 6.52 4.64 11.96 10.84 13.17l4.02-9.88a4.5 4.5 0 0 1-1.86-3.79 4.5 4.5 0 0 1 4.5-4.5 4.5 4.5 0 0 1 4.5 4.5 4.5 4.5 0 0 1-4.35 4.5l-3.84 4.03C13.84 27 13.67 27 13.5 27 6.04 27 0 20.96 0 13.5S6.04 0 13.5 0zm-3.35 17.77l-1.5.62a3 3 0 0 0 1.44 1.59 3 3 0 0 0 2.28.19 3 3 0 0 0 1.8-1.54 3 3 0 0 0 .19-2.28 3 3 0 0 0-1.54-1.8 3 3 0 0 0-2.07-.2l1.55 3.8-.15-.38zm6.35-3.27a2.5 2.5 0 0 0-2.5-2.5 2.5 2.5 0 0 0-2.5 2.5 2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0 2.5-2.5z" />
    </svg>
  );
}
