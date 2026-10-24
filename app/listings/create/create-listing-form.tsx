"use client";

import { useActionState, useState } from "react";
import { createListing } from "@/server/actions";
import { PlusCircle, Image as ImageIcon, DollarSign, MapPin, Tag, FileText, Loader2, Sparkles } from "lucide-react";

const SAMPLE_IMAGES = [
  { label: "Textbook", url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600" },
  { label: "Electronics", url: "https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=600" },
  { label: "Dorm Furniture", url: "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=600" },
  { label: "Free Item", url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600" },
];

export function CreateListingForm({ userCampusName }: { userCampusName: string }) {
  const [state, formAction, pending] = useActionState(createListing, undefined);
  const [selectedImage, setSelectedImage] = useState("");
  const [isFree, setIsFree] = useState(false);

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <PlusCircle className="h-6 w-6 text-primary" />
            Create a New Listing
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            List an item to sell or give away to fellow students at <strong className="text-foreground">{userCampusName}</strong>.
          </p>
        </div>

        {state?.error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-600 dark:text-red-400">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-5">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Listing Title</label>
            <input
              type="text"
              name="title"
              required
              placeholder="e.g., Organic Chemistry 8th Edition, Desk Fan, Mini Fridge"
              className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Category & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground flex items-center gap-1">
                <Tag className="h-4 w-4 text-muted-foreground" />
                Category
              </label>
              <select
                name="category"
                required
                defaultValue="BOOKS"
                onChange={(e) => {
                  if (e.target.value === "FREE") setIsFree(true);
                }}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="BOOKS">Books & Textbooks</option>
                <option value="FURNITURE">Dorm & Furniture</option>
                <option value="ELECTRONICS">Electronics & Gadgets</option>
                <option value="CLOTHING">Clothing & Apparel</option>
                <option value="FREE">Free Giveaway</option>
                <option value="OTHER">Other Goods</option>
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  Price (USD)
                </label>
                <label className="text-xs text-primary flex items-center gap-1 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={isFree}
                    onChange={(e) => setIsFree(e.target.checked)}
                    className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
                  />
                  Mark as Free
                </label>
              </div>
              <input
                type="number"
                name="price"
                min="0"
                step="0.01"
                required
                value={isFree ? "0" : undefined}
                disabled={isFree}
                placeholder="0.00"
                className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60"
              />
            </div>
          </div>

          {/* Image URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-1">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              Image URL
            </label>
            <input
              type="url"
              name="imageUrl"
              required
              value={selectedImage}
              onChange={(e) => setSelectedImage(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-xs"
            />
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-500" /> Quick photo presets:
              </span>
              {SAMPLE_IMAGES.map((img) => (
                <button
                  type="button"
                  key={img.label}
                  onClick={() => setSelectedImage(img.url)}
                  className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  {img.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pickup Spot */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground flex items-center gap-1">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Designated Pickup Spot
            </label>
            <input
              type="text"
              name="pickupSpot"
              required
              defaultValue="Campus Library / Main Gate"
              placeholder="e.g. Student Center Lobby, Campus Library 1st Floor"
              className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-muted-foreground">
              Choose a public, safe, and convenient location on or near campus.
            </p>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground flex items-center gap-1">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Description & Condition
            </label>
            <textarea
              name="description"
              required
              rows={4}
              placeholder="Describe condition, edition (for textbooks), reason for selling, dimensions, etc."
              className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={pending}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 px-4 font-semibold text-white hover:bg-primary-hover shadow-sm transition-all disabled:opacity-50"
            >
              {pending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Publishing Listing...
                </>
              ) : (
                "Publish Listing"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
