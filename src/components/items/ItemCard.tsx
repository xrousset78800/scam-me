"use client";

import Image from "next/image";
import { cn, rarityColor, exteriorAbbr, formatPrice } from "@/lib/utils";
import type { SteamItem } from "@/types";

interface Props {
  item: SteamItem;
  selected?: boolean;
  onSelect?: (item: SteamItem) => void;
  side?: "offer" | "request";
}

export function ItemCard({ item, selected = false, onSelect, side }: Props) {
  const borderColor = rarityColor(item.rarityKey);

  return (
    <button
      onClick={() => onSelect?.(item)}
      className={cn(
        "group relative flex flex-col rounded-lg border-2 bg-surface-2 p-2 text-left",
        "transition-all duration-150 hover:scale-[1.03] hover:shadow-lg",
        selected
          ? side === "offer"
            ? "border-success shadow-success/20"
            : "border-accent shadow-accent/20"
          : "border-transparent hover:border-white/20"
      )}
      style={selected ? {} : { "--rarity-color": borderColor } as React.CSSProperties}
    >
      {/* Rarity stripe */}
      <div
        className="absolute inset-x-0 top-0 h-0.5 rounded-t-lg"
        style={{ backgroundColor: borderColor }}
      />

      {/* Item image */}
      <div className="relative mx-auto h-24 w-full">
        <Image
          src={item.iconUrl}
          alt={item.name}
          fill
          className="object-contain drop-shadow-md"
          unoptimized
        />
        {item.float !== undefined && (
          <FloatBar float={item.float} />
        )}
      </div>

      {/* Info */}
      <div className="mt-1.5 space-y-0.5">
        {(item.isStatTrak || item.isSouvenir) && (
          <span
            className={cn(
              "text-[10px] font-semibold uppercase tracking-wide",
              item.isStatTrak ? "text-orange-400" : "text-yellow-400"
            )}
          >
            {item.isStatTrak ? "StatTrak™" : "Souvenir"}
          </span>
        )}

        <p className="text-xs font-medium text-white leading-tight line-clamp-2">{item.name}</p>

        {item.exterior && (
          <p className="text-[10px] text-muted">{exteriorAbbr(item.exterior)}</p>
        )}
      </div>

      {/* Price */}
      {item.price != null && (
        <div className="mt-auto pt-1.5">
          <span className="text-sm font-bold text-accent">{formatPrice(item.price)}</span>
        </div>
      )}

      {/* Selected overlay */}
      {selected && (
        <div className="absolute inset-0 rounded-lg bg-white/5 flex items-center justify-center">
          <span className="rounded-full bg-success/90 px-2 py-0.5 text-[10px] font-bold text-white">
            {side === "offer" ? "OFFERT" : "VOULU"}
          </span>
        </div>
      )}

      {/* Stickers */}
      {item.stickers.length > 0 && (
        <div className="absolute bottom-1 right-1 flex gap-0.5">
          {item.stickers.slice(0, 4).map((s, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={s.imageUrl} alt={s.name} className="h-4 w-4 object-contain" />
          ))}
        </div>
      )}
    </button>
  );
}

function FloatBar({ float }: { float: number }) {
  const pct = Math.round(float * 100);
  return (
    <div className="absolute bottom-0 inset-x-1 h-1 rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-gradient-to-r from-green-400 to-red-400"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
