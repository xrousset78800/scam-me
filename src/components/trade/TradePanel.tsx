"use client";

import { ArrowLeftRight, X } from "lucide-react";
import { cn, formatPrice, priceDiffLabel } from "@/lib/utils";
import { ItemCard } from "@/components/items/ItemCard";
import type { SteamItem } from "@/types";

interface Props {
  offeredItems: SteamItem[];
  requestedItems: SteamItem[];
  priceDiff: number;
  onRemoveOffered: (item: SteamItem) => void;
  onRemoveRequested: (item: SteamItem) => void;
  onSubmit: () => void;
  submitting?: boolean;
}

export function TradePanel({
  offeredItems,
  requestedItems,
  priceDiff,
  onRemoveOffered,
  onRemoveRequested,
  onSubmit,
  submitting = false,
}: Props) {
  const isEmpty = offeredItems.length === 0 && requestedItems.length === 0;
  const diffPositive = priceDiff >= 0;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
        <ArrowLeftRight className="h-4 w-4 text-accent" />
        Résumé de l&apos;échange
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {/* Offered */}
        <PanelSide
          title="Tu offres"
          items={offeredItems}
          side="offer"
          onRemove={onRemoveOffered}
          emptyLabel="Sélectionne des skins de ton inventaire"
        />

        {/* Requested */}
        <PanelSide
          title="Tu veux"
          items={requestedItems}
          side="request"
          onRemove={onRemoveRequested}
          emptyLabel="Sélectionne des skins du market"
        />
      </div>

      {/* Price diff */}
      {!isEmpty && (
        <div
          className={cn(
            "rounded-lg border px-4 py-3 text-center text-sm font-semibold",
            diffPositive
              ? "border-success/30 bg-success/10 text-success"
              : "border-danger/30 bg-danger/10 text-danger"
          )}
        >
          {priceDiffLabel(priceDiff)}
          <div className="mt-0.5 text-xs font-normal opacity-70">
            Offert: {formatPrice(offeredItems.reduce((a, i) => a + (i.price ?? 0), 0))} /
            Demandé: {formatPrice(requestedItems.reduce((a, i) => a + (i.price ?? 0), 0))}
          </div>
        </div>
      )}

      <button
        onClick={onSubmit}
        disabled={isEmpty || submitting}
        className={cn(
          "w-full rounded-lg py-2.5 text-sm font-bold transition-colors",
          isEmpty || submitting
            ? "bg-surface-2 text-muted cursor-not-allowed"
            : "bg-accent hover:bg-accent-hover text-black"
        )}
      >
        {submitting ? "Envoi en cours..." : "Envoyer l'offre de trade"}
      </button>
    </div>
  );
}

function PanelSide({
  title,
  items,
  side,
  onRemove,
  emptyLabel,
}: {
  title: string;
  items: SteamItem[];
  side: "offer" | "request";
  onRemove: (item: SteamItem) => void;
  emptyLabel: string;
}) {
  const total = items.reduce((a, i) => a + (i.price ?? 0), 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted">{title}</span>
        {items.length > 0 && (
          <span className="text-xs font-bold text-white">{formatPrice(total)}</span>
        )}
      </div>
      <div
        className={cn(
          "min-h-[80px] rounded-lg border-2 border-dashed p-2",
          side === "offer" ? "border-success/30" : "border-accent/30"
        )}
      >
        {items.length === 0 ? (
          <p className="flex h-16 items-center justify-center text-center text-[11px] text-muted px-2">
            {emptyLabel}
          </p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {items.map((item) => (
              <div key={item.assetId} className="relative">
                <div className="h-14 w-14">
                  <ItemCard item={item} selected side={side} />
                </div>
                <button
                  onClick={() => onRemove(item)}
                  className="absolute -right-1 -top-1 rounded-full bg-danger p-0.5 hover:bg-red-600"
                >
                  <X className="h-2.5 w-2.5 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
