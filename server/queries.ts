import "server-only";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type FeedParams = {
  campusId?: string;
  mode?: "exact" | "radius";
  radius?: number;
  category?: string;
  query?: string;
};

export type FeedItem = {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  pickupSpot: string;
  campusId: string;
  campusName: string;
  category: string;
  status: string;
  userId: string;
  distanceKm: number | null;
  createdAt: Date;
};

export async function fetchFeedItems({
  campusId,
  mode = "exact",
  radius = 10,
  category,
  query = "",
}: FeedParams): Promise<FeedItem[]> {
  if (mode === "radius" && campusId) {
    const originCampus = await prisma.campus.findUnique({
      where: { id: campusId },
      select: { latitude: true, longitude: true },
    });

    if (originCampus) {
      const conditions: string[] = [];
      const params: unknown[] = [originCampus.latitude, originCampus.longitude, radius];

      if (category) {
        params.push(category);
        conditions.push(`AND l."category"::text = $${params.length}`);
      }
      if (query) {
        params.push(`%${query}%`);
        conditions.push(`AND l."title" ILIKE $${params.length}`);
      }

      const sql = `
        SELECT 
          l.id, l.title, l.description, l.price, l."imageUrl", l."pickupSpot",
          l."campusId", l.category::text as category, l.status::text as status,
          l."userId", l."createdAt",
          c.name AS "campusName",
          (6371 * acos(
            LEAST(1.0, GREATEST(-1.0,
              cos(radians($1)) * cos(radians(l.latitude)) *
              cos(radians(l.longitude) - radians($2)) +
              sin(radians($1)) * sin(radians(l.latitude))
            ))
          )) AS "distanceKm"
        FROM "Listing" l
        JOIN "Campus" c ON l."campusId" = c.id
        WHERE l.status != 'SOLD'
        AND (6371 * acos(
          LEAST(1.0, GREATEST(-1.0,
            cos(radians($1)) * cos(radians(l.latitude)) *
            cos(radians(l.longitude) - radians($2)) +
            sin(radians($1)) * sin(radians(l.latitude))
          ))
        )) <= $3
        ${conditions.join("\n        ")}
        ORDER BY "distanceKm" ASC
      `;

      const results = await prisma.$queryRawUnsafe<FeedItem[]>(sql, ...params);
      return results;
    }
  }

  // Exact campus or open fallback
  const listings = await prisma.listing.findMany({
    where: {
      ...(campusId ? { campusId } : {}),
      ...(category ? { category: category as any } : {}),
      ...(query
        ? { title: { contains: query, mode: "insensitive" as const } }
        : {}),
      status: { not: "SOLD" },
    },
    include: { campus: true },
    orderBy: { createdAt: "desc" },
  });

  return listings.map((l) => ({
    id: l.id,
    title: l.title,
    description: l.description,
    price: l.price,
    imageUrl: l.imageUrl,
    pickupSpot: l.pickupSpot,
    campusId: l.campusId,
    campusName: l.campus.name,
    category: l.category,
    status: l.status,
    userId: l.userId,
    distanceKm: null,
    createdAt: l.createdAt,
  }));
}

export async function getCampuses() {
  return prisma.campus.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, latitude: true, longitude: true },
  });
}

export async function getListingById(id: string) {
  return prisma.listing.findUnique({
    where: { id },
    include: {
      campus: true,
      user: { select: { id: true, name: true, email: true, campus: true } },
      _count: { select: { favorites: true } },
    },
  });
}

export async function getUserListings(userId: string) {
  return prisma.listing.findMany({
    where: { userId },
    include: { campus: true, _count: { select: { favorites: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getUserFavorites(userId: string) {
  return prisma.favorite.findMany({
    where: { userId },
    include: {
      listing: {
        include: { campus: true, user: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function isFavorited(userId: string, listingId: string) {
  const fav = await prisma.favorite.findUnique({
    where: { userId_listingId: { userId, listingId } },
  });
  return !!fav;
}

export async function getFavoritedIds(userId: string): Promise<Set<string>> {
  const favs = await prisma.favorite.findMany({
    where: { userId },
    select: { listingId: true },
  });
  return new Set(favs.map((f) => f.listingId));
}
