import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getListingById, isFavorited } from "@/server/queries";
import { getSession } from "@/lib/auth";
import { formatPrice } from "@/lib/utils";
import { ListingDetailActions } from "./listing-detail-actions";
import { MapPin, User, ArrowLeft, Clock, ShieldCheck, Tag } from "lucide-react";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ListingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const listing = await getListingById(id);

  if (!listing) {
    notFound();
  }

  const session = await getSession();
  const isLoggedIn = !!session?.userId;
  const isOwner = session?.userId === listing.userId;
  const favorited = session?.userId ? await isFavorited(session.userId, listing.id) : false;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Listings
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors border border-primary/20"
        >
          <span>Home</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Image */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-muted">
            <Image
              src={listing.imageUrl}
              alt={listing.title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
            {listing.status !== "AVAILABLE" && (
              <div className="absolute top-4 left-4 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-red-600 text-white shadow-md">
                {listing.status}
              </div>
            )}
          </div>

          {/* Safety Notice */}
          <div className="rounded-xl border border-border bg-surface/50 p-4 flex items-start gap-3 text-xs text-muted-foreground">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground mb-0.5">Campus Safety First</p>
              <p>
                Always meet in well-lit, public campus locations such as the library, dining hall, or student union.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Listing Details & Actions */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Category & Status */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Tag className="h-3 w-3" />
                {listing.category}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Listed {new Date(listing.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Title & Price */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
              {listing.title}
            </h1>
            <div className="text-3xl font-black text-primary">
              {formatPrice(listing.price)}
            </div>

            {/* Location & Pickup Spot */}
            <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                {listing.campus.name}
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                Designated Pickup: <span className="font-medium text-foreground">{listing.pickupSpot}</span>
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Description</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {listing.description}
              </p>
            </div>

            {/* Seller Card */}
            <div className="rounded-xl border border-border bg-surface p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                  {listing.user.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{listing.user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {listing.user.campus?.name} Student
                  </p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Verified Student
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-border">
            <ListingDetailActions
              listingId={listing.id}
              sellerEmail={listing.user.email}
              sellerName={listing.user.name}
              listingTitle={listing.title}
              initialFavorited={favorited}
              isLoggedIn={isLoggedIn}
              isOwner={isOwner}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
