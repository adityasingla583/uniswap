"use client";

import { useTransition } from "react";
import { updateListingStatus, deleteListing } from "@/server/actions";
import { Trash2, CheckCircle2, Clock, CheckCheck, Loader2 } from "lucide-react";

export function ListingActionControls({
  listingId,
  currentStatus,
}: {
  listingId: string;
  currentStatus: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(newStatus: "AVAILABLE" | "RESERVED" | "SOLD") {
    startTransition(async () => {
      await updateListingStatus(listingId, newStatus);
    });
  }

  function handleDelete() {
    if (confirm("Are you sure you want to delete this listing permanently?")) {
      startTransition(async () => {
        await deleteListing(listingId);
      });
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Status Selector */}
      <div className="inline-flex rounded-lg border border-border p-0.5 bg-surface text-xs">
        <button
          onClick={() => handleStatusChange("AVAILABLE")}
          disabled={isPending}
          className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
            currentStatus === "AVAILABLE"
              ? "bg-green-500/20 text-green-700 dark:text-green-300"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Available
        </button>
        <button
          onClick={() => handleStatusChange("RESERVED")}
          disabled={isPending}
          className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
            currentStatus === "RESERVED"
              ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Reserved
        </button>
        <button
          onClick={() => handleStatusChange("SOLD")}
          disabled={isPending}
          className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
            currentStatus === "SOLD"
              ? "bg-red-500/20 text-red-700 dark:text-red-300"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Sold
        </button>
      </div>

      {/* Delete button */}
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="p-1.5 rounded-lg border border-border hover:bg-red-500/10 text-muted-foreground hover:text-red-600 transition-colors"
        title="Delete listing"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </button>
    </div>
  );
}
