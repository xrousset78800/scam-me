import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const search = searchParams.get("q") ?? "";
  const rarity = searchParams.get("rarity");
  const exterior = searchParams.get("exterior");
  const minPrice = parseFloat(searchParams.get("minPrice") ?? "0");
  const maxPrice = parseFloat(searchParams.get("maxPrice") ?? "99999");
  const sort = searchParams.get("sort") ?? "price_asc";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "60"), 120);
  const skip = (page - 1) * limit;

  const orderBy = {
    price_asc: { prices: { _count: "asc" } },
    price_desc: { prices: { _count: "desc" } },
    name_asc: { name: "asc" },
  }[sort] ?? { name: "asc" };

  const where = {
    ...(search && { name: { contains: search, mode: "insensitive" as const } }),
    ...(rarity && { rarity: rarity.toUpperCase() }),
    ...(exterior && { exterior: exterior.toUpperCase().replace(" ", "_") }),
    listings: {
      some: { status: "AVAILABLE" },
    },
  };

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where: { status: "AVAILABLE" },
      include: {
        item: {
          include: { prices: true },
        },
      },
      take: limit,
      skip,
    }),
    prisma.listing.count({ where: { status: "AVAILABLE" } }),
  ]);

  return NextResponse.json({ listings, total, page, limit });
}
