import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getUserListings } from "@/server/queries";
import { formatPrice } from "@/lib/utils";
import { ListingActionControls } from "./listing-actions-controls";
import { Package, Plus, Heart, Eye } from "lucide-react";

export const metadata = {
  title: "My Listings | Local Loop",
  description: "Manage your active listings, reserve items, and mark items as sold",
};

export default async function MyListingsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const listings = await getUserListings(session.userId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              My Listings
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage inventory, reserve for buyers, and mark sold items
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-all"
          >
            Home
          </Link>
          <Link
            href="/listings/create"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-primary-hover shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" />
            Post New Item
          </Link>
        </div>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-xl border border-dashed border-border bg-surface/50">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold text-foreground">You haven&apos;t posted any listings</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Ready to pass on a textbook or clear dorm space? Post your first item in seconds.
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
        <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
          {listings.map((item) => (
            <div
              key={item.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-lg overflow-hidden bg-muted shrink-0">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded font-semibold bg-primary/10 text-primary">
                      {item.category}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <Link
                    href={`/listings/${item.id}`}
                    className="text-base font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
                  >
                    {item.title}
                  </Link>
                  <p className="text-sm font-bold text-primary">
                    {formatPrice(item.price)}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Heart className="h-3.5 w-3.5 text-red-500" />
                      {item._count.favorites} saves
                    </span>
                    <span>·</span>
                    <span>Pickup: {item.pickupSpot}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <Link
                  href={`/listings/${item.id}`}
                  className="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="View listing"
                >
                  <Eye className="h-4 w-4" />
                </Link>
                <ListingActionControls
                  listingId={item.id}
                  currentStatus={item.status}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
