import { Suspense } from "react";
import { FilterBar } from "./components/filter-bar";
import { ListingCard } from "./components/listing-card";
import { ListingGrid } from "./components/listing-grid";
import { fetchFeedItems, getFavoritedIds } from "@/server/queries";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PackageOpen, Plus, School, MapPin, Sparkles, UserPlus } from "lucide-react";
import Link from "next/link";

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function HomePage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;

  const session = await getSession();
  const isLoggedIn = !!session?.userId;

  // Retrieve user and their registered campus
  let user: {
    id: string;
    name: string;
    campusId: string;
    campus: { id: string; name: string };
  } | null = null;

  if (session?.userId) {
    user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        campusId: true,
        campus: { select: { id: true, name: true } },
      },
    });
  }

  // Active campus:
  // 1. If user is logged in, their active campus is STRICTLY their registered campus!
  // 2. If guest, allow ?campusId= query param or default to a campus with active listings
  let activeCampus: { id: string; name: string } | null = null;

  if (user?.campus) {
    activeCampus = user.campus;
  } else if (resolvedParams.campusId && typeof resolvedParams.campusId === "string") {
    activeCampus = await prisma.campus.findUnique({
      where: { id: resolvedParams.campusId },
      select: { id: true, name: true },
    });
  }

  if (!activeCampus) {
    const campusWithListings = await prisma.listing.findFirst({
      select: { campus: { select: { id: true, name: true } } },
    });
    activeCampus = campusWithListings?.campus || null;
  }

  const campusId = activeCampus?.id;
  const mode = (resolvedParams.mode === "radius" ? "radius" : "exact") as "exact" | "radius";
  const radius = resolvedParams.radius ? Number(resolvedParams.radius) : 10;
  const category = typeof resolvedParams.category === "string" ? resolvedParams.category : undefined;
  const query = typeof resolvedParams.q === "string" ? resolvedParams.q : undefined;

  const [items, favoritedIds] = await Promise.all([
    fetchFeedItems({
      campusId,
      mode,
      radius,
      category,
      query,
    }),
    session?.userId ? getFavoritedIds(session.userId) : Promise.resolve(new Set<string>()),
  ]);

  return (
    <div className="space-y-6">
      {/* Logged in vs Guest Campus Notice Banner */}
      {isLoggedIn && user ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-surface border border-border shadow-xs">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <School className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Your Campus Marketplace
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                  {mode === "exact" ? "Same Campus Only" : `Within ${radius} km radius`}
                </span>
              </div>
              <h2 className="text-base font-bold text-foreground">
                {user.campus.name}
              </h2>
            </div>
          </div>

          <div className="text-xs text-muted-foreground flex items-center gap-1.5 self-start sm:self-center">
            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>
              {mode === "exact"
                ? "Showing items strictly on your campus"
                : `Expanded to nearby campuses within ${radius} km`}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-primary/15 via-primary/5 to-transparent border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0">
              <School className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Preview Mode
              </span>
              <p className="text-xs sm:text-sm font-semibold text-foreground">
                Currently previewing items from <strong className="text-primary">{activeCampus?.name}</strong>.
              </p>
              <p className="text-xs text-muted-foreground">
                Register to select your own institute from 53+ universities across India.
              </p>
            </div>
          </div>

          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-xs font-semibold text-white hover:bg-primary-hover shadow-sm transition-all shrink-0"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Register Your Campus
          </Link>
        </div>
      )}

      {/* Filter and Distance Discovery Bar */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-sm py-2">
        <Suspense fallback={<div className="h-12 rounded-xl bg-muted animate-pulse" />}>
          <FilterBar userCampusName={activeCampus?.name} />
        </Suspense>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground px-1">
        <span>
          Showing <strong className="text-foreground">{items.length}</strong> {items.length === 1 ? "item" : "items"}
          {mode === "radius" ? ` within ${radius} km of ${activeCampus?.name}` : ` on ${activeCampus?.name}`}
          {category ? ` in ${category.toLowerCase()}` : ""}
          {query ? ` matching "${query}"` : ""}
        </span>
      </div>

      {/* Listings Grid */}
      {items.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-border bg-surface/50 space-y-4">
          <PackageOpen className="mx-auto h-12 w-12 text-muted-foreground" />
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-foreground">No listings found</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {mode === "exact"
                ? `No items currently listed for this filter right on ${activeCampus?.name}. Try expanding your search radius to 5 km, 15 km, or 25 km to discover items from nearby colleges!`
                : "No items match your selected filters within this distance radius. Try broadening the radius or checking another category."}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/listings/create"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-primary-hover transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Be the First to Post an Item
            </Link>
          </div>
        </div>
      ) : (
        <ListingGrid>
          {items.map((item) => (
            <ListingCard
              key={item.id}
              id={item.id}
              title={item.title}
              price={item.price}
              imageUrl={item.imageUrl}
              campusName={item.campusName}
              pickupSpot={item.pickupSpot}
              category={item.category}
              status={item.status}
              distanceKm={item.distanceKm}
              isFavorited={favoritedIds.has(item.id)}
              isLoggedIn={isLoggedIn}
            />
          ))}
        </ListingGrid>
      )}
    </div>
  );
}
