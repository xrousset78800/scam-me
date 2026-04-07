"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession, signIn } from "next-auth/react";
import { ItemCard } from "@/components/items/ItemCard";
import { FilterBar } from "@/components/items/FilterBar";
import { TradePanel } from "@/components/trade/TradePanel";
import { calcPriceDiff } from "@/lib/prices";
import type { SteamItem, FilterState } from "@/types";

const DEFAULT_FILTER: FilterState = {
  search: "",
  sort: "price_asc",
};

// Mock data for UI development — replace with real API calls
const MOCK_MARKET_ITEMS: SteamItem[] = [
  {
    assetId: "m1", classId: "1", instanceId: "0",
    marketHashName: "AK-47 | Redline (Field-Tested)",
    name: "AK-47 | Redline", type: "Rifle",
    exterior: "Field-Tested", rarity: "Classified", rarityKey: "classified",
    iconUrl: "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I4D0hl5qoTg9wYYJQIAFZygpMbIFZkWFMoU6TASeepuKpz2xUpRB04D5CuZmyEB9lfvbKZGJF09yzlY6PkfX2YrOFkzpT6Zol2u-XpY2kjVfhr0BpZGz0IodKNQ/360fx360f",
    float: 0.23, paintSeed: 661, stickers: [],
    isStatTrak: false, isSouvenir: false, tradable: true, price: 12.50,
  },
  {
    assetId: "m2", classId: "2", instanceId: "0",
    marketHashName: "AWP | Asiimov (Field-Tested)",
    name: "AWP | Asiimov", type: "Sniper Rifle",
    exterior: "Field-Tested", rarity: "Covert", rarityKey: "covert",
    iconUrl: "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I4D0hl5qoTg9wYYJQIAFZygpMbIFZkWFMoU6TASeepuKpz2xUpRB04D5CuZmyEB9lfvbKZGJF09yzlY6PkfX2YrOFkzpT6Zol2u-XpY2kjVfhr0BpZGz0IodKNQ/360fx360f",
    float: 0.19, paintSeed: 321, stickers: [],
    isStatTrak: false, isSouvenir: false, tradable: true, price: 45.00,
  },
  {
    assetId: "m3", classId: "3", instanceId: "0",
    marketHashName: "M4A4 | Howl (Field-Tested)",
    name: "M4A4 | Howl", type: "Rifle",
    exterior: "Field-Tested", rarity: "Contraband", rarityKey: "contraband",
    iconUrl: "https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I4D0hl5qoTg9wYYJQIAFZygpMbIFZkWFMoU6TASeepuKpz2xUpRB04D5CuZmyEB9lfvbKZGz0IodKNQ/360fx360f",
    float: 0.32, paintSeed: 742, stickers: [],
    isStatTrak: false, isSouvenir: false, tradable: true, price: 850.00,
  },
];

export default function TradePage() {
  const { data: session, status } = useSession();

  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);
  const [marketItems] = useState<SteamItem[]>(MOCK_MARKET_ITEMS);
  const [userInventory, setUserInventory] = useState<SteamItem[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);

  const [offeredItems, setOfferedItems] = useState<SteamItem[]>([]);
  const [requestedItems, setRequestedItems] = useState<SteamItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Load user inventory when logged in
  useEffect(() => {
    if (!session) return;
    setInventoryLoading(true);
    fetch("/api/inventory")
      .then((r) => r.json())
      .then((d) => setUserInventory(d.items ?? []))
      .catch(console.error)
      .finally(() => setInventoryLoading(false));
  }, [session]);

  const filteredMarket = useMemo(() => {
    return marketItems.filter((item) => {
      if (filter.search && !item.name.toLowerCase().includes(filter.search.toLowerCase())) return false;
      if (filter.rarity && item.rarityKey !== filter.rarity) return false;
      if (filter.exterior && item.exterior !== filter.exterior) return false;
      if (filter.minPrice && (item.price ?? 0) < filter.minPrice) return false;
      if (filter.maxPrice && (item.price ?? 0) > filter.maxPrice) return false;
      return true;
    });
  }, [marketItems, filter]);

  const toggleOffered = useCallback((item: SteamItem) => {
    setOfferedItems((prev) =>
      prev.find((i) => i.assetId === item.assetId)
        ? prev.filter((i) => i.assetId !== item.assetId)
        : [...prev, item]
    );
  }, []);

  const toggleRequested = useCallback((item: SteamItem) => {
    setRequestedItems((prev) =>
      prev.find((i) => i.assetId === item.assetId)
        ? prev.filter((i) => i.assetId !== item.assetId)
        : [...prev, item]
    );
  }, []);

  const priceDiff = calcPriceDiff(
    offeredItems.map((i) => i.price ?? 0),
    requestedItems.map((i) => i.price ?? 0)
  );

  const handleSubmit = async () => {
    if (!session) return signIn("steam");
    setSubmitting(true);
    try {
      const res = await fetch("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offeredListingIds: offeredItems.map((i) => i.assetId),
          requestedListingIds: requestedItems.map((i) => i.assetId),
        }),
      });
      if (res.ok) {
        setOfferedItems([]);
        setRequestedItems([]);
        alert("Offre de trade envoyée ! Vérifie Steam.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
      {/* Left: Market + Inventory */}
      <div className="space-y-6">
        {/* Market */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">Market</h1>
            <span className="text-sm text-muted">{filteredMarket.length} skins</span>
          </div>
          <FilterBar filter={filter} onChange={setFilter} />
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-2">
            {filteredMarket.map((item) => (
              <ItemCard
                key={item.assetId}
                item={item}
                selected={requestedItems.some((i) => i.assetId === item.assetId)}
                onSelect={toggleRequested}
                side="request"
              />
            ))}
          </div>
        </section>

        {/* Inventory */}
        <section className="space-y-4 border-t border-border pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Mon inventaire</h2>
            {inventoryLoading && <span className="text-xs text-muted animate-pulse">Chargement...</span>}
          </div>

          {!session ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-3">
              <p className="text-muted text-sm">Connecte-toi pour voir ton inventaire</p>
              <button
                onClick={() => signIn("steam")}
                className="rounded-lg bg-[#1b2838] border border-[#4c6b8a] px-4 py-2 text-sm text-white hover:bg-[#2a3f5f] transition-colors"
              >
                Connexion Steam
              </button>
            </div>
          ) : userInventory.length === 0 && !inventoryLoading ? (
            <p className="text-sm text-muted">Aucun skin trouvé dans ton inventaire.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-2">
              {userInventory.map((item) => (
                <ItemCard
                  key={item.assetId}
                  item={item}
                  selected={offeredItems.some((i) => i.assetId === item.assetId)}
                  onSelect={toggleOffered}
                  side="offer"
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Right: Trade panel */}
      <aside className="lg:sticky lg:top-20 lg:h-fit">
        <TradePanel
          offeredItems={offeredItems}
          requestedItems={requestedItems}
          priceDiff={priceDiff}
          onRemoveOffered={(item) => setOfferedItems((p) => p.filter((i) => i.assetId !== item.assetId))}
          onRemoveRequested={(item) => setRequestedItems((p) => p.filter((i) => i.assetId !== item.assetId))}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      </aside>
    </div>
  );
}
