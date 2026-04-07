import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchSteamInventory } from "@/lib/steam";
import { fetchPrices } from "@/lib/prices";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const steamId = req.nextUrl.searchParams.get("steamId") ?? (session.user as { steamId?: string }).steamId;
  if (!steamId) return NextResponse.json({ error: "Missing steamId" }, { status: 400 });

  try {
    const items = await fetchSteamInventory(steamId);

    // Fetch prices for all items in batch
    const names = [...new Set(items.map((i) => i.marketHashName))];
    const prices = await fetchPrices(names);

    const enriched = items.map((item) => ({
      ...item,
      price: prices[item.marketHashName] ?? null,
    }));

    return NextResponse.json({ items: enriched, total: enriched.length });
  } catch (err) {
    console.error("[inventory]", err);
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}
