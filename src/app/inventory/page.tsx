"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { RefreshCw } from "lucide-react";
import { ItemCard } from "@/components/items/ItemCard";
import { FilterBar } from "@/components/items/FilterBar";
import { formatPrice } from "@/lib/utils";
import type { SteamItem, FilterState } from "@/types";

const DEFAULT_FILTER: FilterState = { search: "", sort: "price_desc" };

export default function InventoryPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<SteamItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);

  const fetchInventory = () => {
    if (!session) return;
    setLoading(true);
    fetch("/api/inventory")
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const filtered = items.filter((item) => {
    if (filter.search && !item.name.toLowerCase().includes(filter.search.toLowerCase())) return false;
    if (filter.rarity && item.rarityKey !== filter.rarity) return false;
    if (filter.exterior && item.exterior !== filter.exterior) return false;
    return true;
  });

  const totalValue = filtered.reduce((a, i) => a + (i.price ?? 0), 0);

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-muted">Connecte-toi pour voir ton inventaire CS2</p>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Mon inventaire</h1>
          {filtered.length > 0 && (
            <p className="text-sm text-muted mt-1">
              {filtered.length} items · valeur totale{" "}
              <span className="text-accent font-semibold">{formatPrice(totalValue)}</span>
            </p>
          )}
        </div>
        <button
          onClick={fetchInventory}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-white hover:border-white/40 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      <FilterBar filter={filter} onChange={setFilter} />

      {loading ? (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 gap-2">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-surface-2 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center py-16 text-muted">Aucun item trouvé.</p>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 gap-2">
          {filtered.map((item) => (
            <ItemCard key={item.assetId} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
