import { Suspense } from "react";
import { FilterBar } from "./components/filter-bar";
import { ListingCard } from "./components/listing-card";
import { ListingGrid, ListingGridSkeleton } from "./components/listing-grid";
import { fetchFeedItems, getFavoritedIds } from "@/server/queries";
import { getSession } from "@/lib/auth";
import { PackageOpen, Plus } from "lucide-react";
import Link from "next/link";

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function HomePage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;

  const campusId = typeof resolvedParams.campusId === "string" ? resolvedParams.campusId : undefined;
  const mode = (resolvedParams.mode === "radius" ? "radius" : "exact") as "exact" | "radius";
  const radius = resolvedParams.radius ? Number(resolvedParams.radius) : 10;
  const category = typeof resolvedParams.category === "string" ? resolvedParams.category : undefined;
  const query = typeof resolvedParams.q === "string" ? resolvedParams.q : undefined;

  const session = await getSession();
  const isLoggedIn = !!session?.userId;

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
      {/* Hero Banner when no campus or search */}
      {!campusId && !query && (
        <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6 sm:p-8">
          <div className="max-w-2xl space-y-2">
            <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-primary/20 text-primary">
              Hyper-Local Campus Trading
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Buy, sell, and give away gear within your campus community
            </h1>
            <p className="text-sm text-muted-foreground">
              Filter by your university or broaden your radius to discover textbooks, electronics, dorm essentials, and free finds nearby.
            </p>
          </div>
        </div>
      )}

      {/* Filter and Discovery Bar */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-sm py-2">
        <Suspense fallback={<div className="h-10 rounded-full bg-muted animate-pulse" />}>
          <FilterBar />
        </Suspense>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
        <span>
          Showing <strong className="text-foreground">{items.length}</strong> {items.length === 1 ? "item" : "items"}
          {campusId && mode === "radius" ? ` within ${radius} km` : ""}
          {category ? ` in ${category.toLowerCase()}` : ""}
          {query ? ` for "${query}"` : ""}
        </span>
      </div>

      {/* Listings Grid */}
      {items.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-xl border border-dashed border-border bg-surface/50">
          <PackageOpen className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold text-foreground">No listings found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Try adjusting your search filters, broadening the distance radius, or be the first to list an item!
          </p>
          <div className="mt-6">
            <Link
              href="/listings/create"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
            >
              <Plus className="h-4 w-4" />
              Post a Listing
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
