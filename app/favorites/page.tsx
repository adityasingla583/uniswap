import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getUserFavorites } from "@/server/queries";
import { ListingCard } from "../components/listing-card";
import { ListingGrid } from "../components/listing-grid";
import { Heart, PackageOpen } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "My Favorites | Local Loop",
  description: "View and manage your saved campus marketplace items",
};

export default async function FavoritesPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const favorites = await getUserFavorites(session.userId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
            <Heart className="h-5 w-5 fill-current" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Saved Items
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {favorites.length} {favorites.length === 1 ? "listing" : "listings"} saved to your wishlist
            </p>
          </div>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors border border-primary/20"
        >
          <span>Home</span>
        </Link>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-xl border border-dashed border-border bg-surface/50">
          <PackageOpen className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold text-foreground">No saved items yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Click the heart icon on any listing card to save items you want to keep an eye on.
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
            >
              Browse Campus Listings
            </Link>
          </div>
        </div>
      ) : (
        <ListingGrid>
          {favorites.map((fav) => (
            <ListingCard
              key={fav.id}
              id={fav.listing.id}
              title={fav.listing.title}
              price={fav.listing.price}
              imageUrl={fav.listing.imageUrl}
              campusName={fav.listing.campus.name}
              pickupSpot={fav.listing.pickupSpot}
              category={fav.listing.category}
              status={fav.listing.status}
              distanceKm={null}
              isFavorited={true}
              isLoggedIn={true}
            />
          ))}
        </ListingGrid>
      )}
    </div>
  );
}
