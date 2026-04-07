"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Trade {
  id: string;
  status: string;
  priceDiff: number;
  createdAt: string;
  offeredItems: string[];
  requestedItems: string[];
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "En attente",
  SENT: "Envoyé",
  ACCEPTED: "Accepté",
  DECLINED: "Refusé",
  CANCELLED: "Annulé",
  EXPIRED: "Expiré",
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: "text-yellow-400 bg-yellow-400/10",
  SENT: "text-blue-400 bg-blue-400/10",
  ACCEPTED: "text-success bg-success/10",
  DECLINED: "text-danger bg-danger/10",
  CANCELLED: "text-muted bg-surface-2",
  EXPIRED: "text-muted bg-surface-2",
};

export default function HistoryPage() {
  const { data: session } = useSession();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    fetch("/api/trade")
      .then((r) => r.json())
      .then((d) => setTrades(d.trades ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session]);

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-muted">Connecte-toi pour voir ton historique</p>
        <button
          onClick={() => signIn("steam")}
          className="rounded-lg bg-[#1b2838] border border-[#4c6b8a] px-6 py-3 text-white hover:bg-[#2a3f5f] transition-colors"
        >
          Connexion Steam
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Historique des échanges</h1>

      {loading ? (
        <p className="text-muted animate-pulse">Chargement...</p>
      ) : trades.length === 0 ? (
        <p className="text-center py-16 text-muted">Aucun échange effectué pour le moment.</p>
      ) : (
        <div className="space-y-3">
          {trades.map((trade) => (
            <div key={trade.id} className="flex items-center justify-between rounded-xl border border-border bg-surface p-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_COLOR[trade.status])}
                  >
                    {STATUS_LABEL[trade.status] ?? trade.status}
                  </span>
                  <span className="text-xs text-muted">
                    {new Date(trade.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </span>
                </div>
                <p className="text-xs text-muted">
                  {trade.offeredItems.length} item(s) offert(s) · {trade.requestedItems.length} item(s) reçu(s)
                </p>
              </div>
              <div className="text-right">
                <p className={cn("text-sm font-bold", trade.priceDiff >= 0 ? "text-success" : "text-danger")}>
                  {trade.priceDiff >= 0 ? "+" : ""}{formatPrice(Math.abs(trade.priceDiff))}
                </p>
                <p className="text-xs text-muted">différence de prix</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
