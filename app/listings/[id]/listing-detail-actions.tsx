"use client";

import { useState, useOptimistic, useTransition } from "react";
import { Heart, Mail, Share2, Check, MessageSquare } from "lucide-react";
import { toggleFavorite } from "@/server/actions";
import { cn } from "@/lib/utils";

export function ListingDetailActions({
  listingId,
  sellerEmail,
  sellerName,
  listingTitle,
  initialFavorited,
  isLoggedIn,
  isOwner,
}: {
  listingId: string;
  sellerEmail: string;
  sellerName: string;
  listingTitle: string;
  initialFavorited: boolean;
  isLoggedIn: boolean;
  isOwner: boolean;
}) {
  const [optimisticFav, setOptimisticFav] = useOptimistic(initialFavorited);
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  function handleFavorite() {
    if (!isLoggedIn) {
      window.location.href = "/login";
      return;
    }
    startTransition(async () => {
      setOptimisticFav(!optimisticFav);
      await toggleFavorite(listingId);
    });
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const mailtoSubject = encodeURIComponent(`[Local Loop] Interested in: ${listingTitle}`);
  const mailtoBody = encodeURIComponent(
    `Hi ${sellerName},\n\nI saw your listing for "${listingTitle}" on Local Loop and would like to arrange a meetup for pickup.\n\nBest,`
  );
  const mailtoUrl = `mailto:${sellerEmail}?subject=${mailtoSubject}&body=${mailtoBody}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {/* Contact Button */}
        {!isOwner ? (
          <button
            onClick={() => setShowContactModal(true)}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 px-6 font-semibold text-white hover:bg-primary-hover shadow-sm transition-all"
          >
            <MessageSquare className="h-5 w-5" />
            Contact Seller
          </button>
        ) : (
          <a
            href="/my-listings"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-muted py-3.5 px-6 font-semibold text-foreground hover:bg-muted-hover border border-border transition-all"
          >
            Manage Your Listing
          </a>
        )}

        {/* Favorite Button */}
        <button
          onClick={handleFavorite}
          disabled={isPending}
          className={cn(
            "p-3.5 rounded-xl border transition-all flex items-center justify-center",
            optimisticFav
              ? "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
              : "border-border bg-surface hover:bg-muted text-muted-foreground"
          )}
          title={optimisticFav ? "Remove from favorites" : "Save to favorites"}
        >
          <Heart className={cn("h-5 w-5", optimisticFav && "fill-current")} />
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="p-3.5 rounded-xl border border-border bg-surface hover:bg-muted text-muted-foreground transition-all flex items-center justify-center"
          title="Copy link to listing"
        >
          {copied ? <Check className="h-5 w-5 text-green-500" /> : <Share2 className="h-5 w-5" />}
        </button>
      </div>

      {copied && (
        <p className="text-xs text-center text-green-600 dark:text-green-400 font-medium animate-fade-in">
          Listing link copied to clipboard!
        </p>
      )}

      {/* Contact Seller Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Contact {sellerName}</h3>
            <p className="text-sm text-muted-foreground">
              Send an email to arrange a time and verify the pickup spot.
            </p>

            <div className="rounded-xl border border-border bg-surface p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Seller Email:</span>
                <span className="font-mono font-medium text-foreground">{sellerEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Item:</span>
                <span className="font-medium text-foreground">{listingTitle}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowContactModal(false)}
                className="flex-1 rounded-lg border border-border py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                Close
              </button>
              <a
                href={mailtoUrl}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-sm font-semibold text-white hover:bg-primary-hover"
                onClick={() => setShowContactModal(false)}
              >
                <Mail className="h-4 w-4" />
                Open Email
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
