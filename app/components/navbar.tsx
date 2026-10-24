"use client";

import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, Plus, Heart, Package, LogOut, LogIn, Menu, X } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";

type Campus = { id: string; name: string };

export function Navbar({
  campuses,
  user,
}: {
  campuses: Campus[];
  user: { id: string; name: string } | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const currentCampusId = searchParams.get("campusId") || "";
  const currentQuery = searchParams.get("q") || "";

  function updateSearch(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.push(`/?${params.toString()}`);
    });
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground hidden sm:block">
              Local Loop
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-xl items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search listings..."
                defaultValue={currentQuery}
                onChange={(e) => {
                  const value = e.target.value;
                  // Debounce by 300ms
                  const timeout = setTimeout(() => updateSearch("q", value), 300);
                  return () => clearTimeout(timeout);
                }}
                className="w-full rounded-lg border border-border bg-surface pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <select
              value={currentCampusId}
              onChange={(e) => updateSearch("campusId", e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">All Campuses</option>
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Actions - Desktop */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <>
                <Link
                  href="/listings/create"
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Post
                </Link>
                <Link
                  href="/favorites"
                  className="p-2 rounded-lg hover:bg-muted transition-colors text-foreground"
                  title="Favorites"
                >
                  <Heart className="h-5 w-5" />
                </Link>
                <Link
                  href="/my-listings"
                  className="p-2 rounded-lg hover:bg-muted transition-colors text-foreground"
                  title="My Listings"
                >
                  <Package className="h-5 w-5" />
                </Link>
                <form action="/api/auth/logout" method="POST">
                  <button
                    type="submit"
                    className="p-2 rounded-lg hover:bg-muted transition-colors text-foreground"
                    title="Sign out"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-foreground"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border py-4 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search listings..."
                defaultValue={currentQuery}
                onChange={(e) => {
                  const value = e.target.value;
                  setTimeout(() => updateSearch("q", value), 300);
                }}
                className="w-full rounded-lg border border-border bg-surface pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            {/* Campus Select */}
            <select
              value={currentCampusId}
              onChange={(e) => updateSearch("campusId", e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            >
              <option value="">All Campuses</option>
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {/* Links */}
            <div className="flex flex-col gap-2">
              {user ? (
                <>
                  <Link
                    href="/listings/create"
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Plus className="h-4 w-4" /> Post a Listing
                  </Link>
                  <Link
                    href="/favorites"
                    className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm text-foreground hover:bg-muted"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Heart className="h-4 w-4" /> Favorites
                  </Link>
                  <Link
                    href="/my-listings"
                    className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm text-foreground hover:bg-muted"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Package className="h-4 w-4" /> My Listings
                  </Link>
                  <form action="/api/auth/logout" method="POST">
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2 rounded-lg px-4 py-2.5 text-sm text-foreground hover:bg-muted"
                    >
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </form>
                </>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  <LogIn className="h-4 w-4" /> Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
