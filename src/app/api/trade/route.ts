import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calcPriceDiff } from "@/lib/prices";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { offeredListingIds, requestedListingIds } = body as {
    offeredListingIds: string[];
    requestedListingIds: string[];
  };

  if (!offeredListingIds?.length && !requestedListingIds?.length) {
    return NextResponse.json({ error: "No items selected" }, { status: 400 });
  }

  // Resolve listings and prices
  const [offered, requested] = await Promise.all([
    prisma.listing.findMany({
      where: { id: { in: offeredListingIds }, status: "AVAILABLE" },
      include: { item: { include: { prices: true } } },
    }),
    prisma.listing.findMany({
      where: { id: { in: requestedListingIds }, status: "AVAILABLE" },
      include: { item: { include: { prices: true } } },
    }),
  ]);

  const getPrice = (listing: (typeof offered)[0]) =>
    listing.item.prices.find((p) => p.source === "buff163")?.price ??
    listing.item.prices[0]?.price ?? 0;

  const offeredPrices = offered.map(getPrice);
  const requestedPrices = requested.map(getPrice);
  const priceDiff = calcPriceDiff(offeredPrices, requestedPrices);

  // Create trade record
  const userId = (session.user as { id?: string }).id;
  const trade = await prisma.trade.create({
    data: {
      initiatorId: userId!,
      offeredItems: offeredListingIds,
      requestedItems: requestedListingIds,
      priceDiff,
      status: "PENDING",
    },
  });

  // TODO: send Steam trade offer via bot (steamcommunity npm package)

  return NextResponse.json({ trade, priceDiff });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id;
  const trades = await prisma.trade.findMany({
    where: { initiatorId: userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ trades });
}
