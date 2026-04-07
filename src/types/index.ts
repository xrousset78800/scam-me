export type Exterior =
  | "Factory New"
  | "Minimal Wear"
  | "Field-Tested"
  | "Well-Worn"
  | "Battle-Scarred";

export type Rarity =
  | "Consumer Grade"
  | "Industrial Grade"
  | "Mil-Spec Grade"
  | "Restricted"
  | "Classified"
  | "Covert"
  | "Contraband";

export type RarityKey =
  | "consumer"
  | "industrial"
  | "milspec"
  | "restricted"
  | "classified"
  | "covert"
  | "contraband";

export interface SteamItem {
  assetId: string;
  classId: string;
  instanceId: string;
  marketHashName: string;
  name: string;
  type: string;
  exterior?: Exterior;
  rarity: Rarity;
  rarityKey: RarityKey;
  iconUrl: string;
  float?: number;
  paintSeed?: number;
  isStatTrak: boolean;
  isSouvenir: boolean;
  stickers: Sticker[];
  tradable: boolean;
  price?: number; // USD
}

export interface Sticker {
  name: string;
  imageUrl: string;
  slot: number;
  wear?: number;
}

export interface TradeOffer {
  offeredItems: SteamItem[];
  requestedItems: SteamItem[];
  priceDiff: number;
}

export interface User {
  id: string;
  steamId: string;
  displayName: string;
  avatarUrl?: string;
  tradeUrl?: string;
}

export interface PriceData {
  marketHashName: string;
  steam: number;
  buff163?: number;
  csfloat?: number;
  reference: number; // price we use
}

export type SortOption = "price_asc" | "price_desc" | "name_asc" | "float_asc";

export interface FilterState {
  search: string;
  rarity?: RarityKey;
  exterior?: Exterior;
  minPrice?: number;
  maxPrice?: number;
  minFloat?: number;
  maxFloat?: number;
  statTrak?: boolean;
  souvenir?: boolean;
  sort: SortOption;
}
