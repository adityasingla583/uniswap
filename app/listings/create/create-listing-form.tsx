"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createListing } from "@/server/actions";
import {
  PlusCircle,
  Image as ImageIcon,
  IndianRupee,
  MapPin,
  Tag,
  FileText,
  Loader2,
  Sparkles,
  ArrowLeft,
  Home,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { normalizeImageUrl } from "@/lib/utils";

const SAMPLE_IMAGES = [
  { label: "Cycle", url: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600" },
  { label: "Textbook", url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600" },
  { label: "Calculator / Gadget", url: "https://images.unsplash.com/photo-1564466809058-bf4114d55352?w=600" },
  { label: "Kettle / Appliance", url: "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=600" },
  { label: "Mattress / Furniture", url: "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600" },
  { label: "Free Giveaway", url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600" },
];

export function CreateListingForm({ userCampusName }: { userCampusName: string }) {
  const [state, formAction, pending] = useActionState(createListing, undefined);
  const [selectedImage, setSelectedImage] = useState("");
  const [isFree, setIsFree] = useState(false);

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-4">
      {/* Home Navigation Button */}
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
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
        >
          <Home className="h-3.5 w-3.5" />
          Go to Home
        </Link>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <PlusCircle className="h-6 w-6 text-primary" />
            Post a Campus Listing
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
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
            <label className="text-xs font-semibold text-foreground">Listing Title</label>
            <input
              type="text"
              name="title"
              required
              placeholder="e.g. Hero Sprint Gear Cycle, HC Verma Vol 1, Casio fx-991EX..."
              className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Category & Price in ₹ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                Category
              </label>
              <select
                name="category"
                required
                defaultValue="BOOKS"
                onChange={(e) => {
                  if (e.target.value === "FREE") setIsFree(true);
                }}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="BOOKS">Books & Textbooks</option>
                <option value="CYCLES_VEHICLES">Cycles & Helmets</option>
                <option value="ELECTRONICS">Electronics & Gadgets</option>
                <option value="DORM_FURNITURE">Dorm & Furniture</option>
                <option value="APPLIANCES">Kettles & Appliances</option>
                <option value="CLOTHING">Clothes & Lab Coats</option>
                <option value="SPORTS_FITNESS">Sports & Fitness</option>
                <option value="STATIONERY_LAB">Stationery & Drafters</option>
                <option value="SERVICES_TICKETS">Cabs & Event Passes</option>
                <option value="FREE">Free Giveaway (₹0)</option>
                <option value="OTHER">Other Goods</option>
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <IndianRupee className="h-3.5 w-3.5 text-muted-foreground" />
                  Price (₹ INR)
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
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                  ₹
                </span>
                <input
                  type="number"
                  name="price"
                  min="0"
                  step="1"
                  required
                  value={isFree ? "0" : undefined}
                  disabled={isFree}
                  placeholder="500"
                  className="w-full rounded-lg border border-border bg-surface pl-8 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
                />
              </div>
            </div>
          </div>

          {/* Image URL with Google Drive Support & Live Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                Photo / Image URL
              </label>
              <span className="text-[11px] text-primary font-medium flex items-center gap-1">
                Google Drive links supported
              </span>
            </div>

            <input
              type="url"
              name="imageUrl"
              required
              value={selectedImage}
              onChange={(e) => setSelectedImage(e.target.value)}
              placeholder="Paste Google Drive link or image URL (https://drive.google.com/...)..."
              className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
            />

            {/* Google Drive Detection Banner */}
            {(selectedImage.includes("drive.google.com") || selectedImage.includes("docs.google.com")) && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl animate-in fade-in-50">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>
                  <strong>Google Drive Link Detected:</strong> Automatically converted to a high-speed direct campus image stream.
                </span>
              </div>
            )}

            {/* Live Image Preview */}
            {selectedImage.trim() && (
              <div className="relative aspect-[16/9] max-h-48 w-full rounded-xl overflow-hidden border border-border bg-muted shadow-xs">
                <img
                  src={normalizeImageUrl(selectedImage)}
                  alt="Listing image preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[11px] font-semibold backdrop-blur-xs flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Live Preview
                </div>
              </div>
            )}

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              💡 <strong>How to use Google Drive photos:</strong> Upload photo to Google Drive &rarr; Right click &rarr; Click <em>&quot;Share&quot;</em> &rarr; Set General Access to <strong>&quot;Anyone with the link can view&quot;</strong> &rarr; Copy and paste link here.
            </p>

            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-500" /> Or pick demo photo:
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
            <label className="text-xs font-semibold text-foreground flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              Designated Campus Meetup Spot
            </label>
            <input
              type="text"
              name="pickupSpot"
              required
              defaultValue="Central Library / Main Gate"
              placeholder="e.g. Central Library Steps, Hostel 14 Canteen, SAC Foyer"
              className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p className="text-xs text-muted-foreground">
              Always choose a safe, familiar, well-lit campus landmark.
            </p>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              Item Description & Condition
            </label>
            <textarea
              name="description"
              required
              rows={4}
              placeholder="Describe condition, edition, brand, reason for selling, whether accessories are included..."
              className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
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
