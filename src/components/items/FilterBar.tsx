"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FilterState, Exterior, RarityKey, SortOption } from "@/types";

interface Props {
  filter: FilterState;
  onChange: (f: FilterState) => void;
  className?: string;
}

const RARITIES: { key: RarityKey; label: string; color: string }[] = [
  { key: "consumer", label: "Consumer", color: "#b0c3d9" },
  { key: "industrial", label: "Industrial", color: "#5e98d9" },
  { key: "milspec", label: "Mil-Spec", color: "#4b69ff" },
  { key: "restricted", label: "Restricted", color: "#8847ff" },
  { key: "classified", label: "Classified", color: "#d32ce6" },
  { key: "covert", label: "Covert", color: "#eb4b4b" },
];

const EXTERIORS: Exterior[] = [
  "Factory New",
  "Minimal Wear",
  "Field-Tested",
  "Well-Worn",
  "Battle-Scarred",
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
  { value: "name_asc", label: "Nom A-Z" },
  { value: "float_asc", label: "Float bas" },
];

export function FilterBar({ filter, onChange, className }: Props) {
  const set = <K extends keyof FilterState>(key: K, value: FilterState[K]) =>
    onChange({ ...filter, [key]: value });

  return (
    <div className={cn("space-y-3", className)}>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
        <input
          type="text"
          placeholder="Rechercher un skin..."
          value={filter.search}
          onChange={(e) => set("search", e.target.value)}
          className="w-full rounded-md border border-border bg-surface-2 py-2 pl-9 pr-3 text-sm text-white placeholder:text-muted focus:border-accent focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {/* Rarity pills */}
        {RARITIES.map((r) => (
          <button
            key={r.key}
            onClick={() => set("rarity", filter.rarity === r.key ? undefined : r.key)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
              filter.rarity === r.key
                ? "bg-surface text-white"
                : "border-transparent bg-surface-2 text-muted hover:text-white"
            )}
            style={filter.rarity === r.key ? { borderColor: r.color, color: r.color } : {}}
          >
            {r.label}
          </button>
        ))}

        <div className="h-4 w-px bg-border" />

        {/* Exterior */}
        <select
          value={filter.exterior ?? ""}
          onChange={(e) => set("exterior", (e.target.value as Exterior) || undefined)}
          className="rounded-md border border-border bg-surface-2 px-3 py-1 text-xs text-white focus:border-accent focus:outline-none"
        >
          <option value="">Tous les extérieurs</option>
          {EXTERIORS.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={filter.sort}
          onChange={(e) => set("sort", e.target.value as SortOption)}
          className="ml-auto rounded-md border border-border bg-surface-2 px-3 py-1 text-xs text-white focus:border-accent focus:outline-none"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
