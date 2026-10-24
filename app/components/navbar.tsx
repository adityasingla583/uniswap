"use client";

import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, Plus, Heart, Package, LogOut, LogIn, Menu, X, Home, School, MessageCircle } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";

type Campus = { id: string; name: string };
type User = {
  id: string;
  name: string;
  campusId?: string;
  campus?: { id: string; name: string };
};

export function Navbar({
  campuses,
  user,
}: {
  campuses: Campus[];
  user: User | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

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
    <nav className="sticky top-0 z-50 border-b border-border bg-surface/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          {/* Brand Logo & Home Button */}
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
                <Package className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-foreground hidden sm:block">
                Local Loop
              </span>
            </Link>

            {/* Dedicated Home Button */}
            <Link
              href="/"
              className={cn(
                "hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ml-1",
                pathname === "/"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              title="Return to Home Feed"
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>
          </div>

          {/* Search Bar & Campus Lock Indicator - Desktop */}
          <div className="hidden md:flex flex-1 max-w-2xl items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search items by title (e.g. cycle, kettle, HC Verma, drafter)..."
                defaultValue={currentQuery}
                onChange={(e) => {
                  const value = e.target.value;
                  const timeout = setTimeout(() => updateSearch("q", value), 300);
                  return () => clearTimeout(timeout);
                }}
                className="w-full rounded-lg border border-border bg-surface pl-9 pr-3 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Active Campus Indicator (All-campuses selection is strictly at registration) */}
            {user?.campus ? (
              <div
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface border border-border text-xs font-semibold text-foreground shrink-0 shadow-xs"
                title={`Your campus: ${user.campus.name}`}
              >
                <School className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="truncate max-w-[180px]">{user.campus.name}</span>
              </div>
            ) : (
              <Link
                href="/register"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-xs font-semibold text-primary shrink-0 hover:bg-primary/20 transition-colors"
                title="Campus selection happens at registration"
              >
                <School className="h-3.5 w-3.5 shrink-0" />
                <span>Select Campus at Register</span>
              </Link>
            )}
          </div>

          {/* Actions - Desktop */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <ThemeToggle />
            {user ? (
              <>
                <Link
                  href="/listings/create"
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition-colors shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  Post Item
                </Link>
                <Link
                  href="/favorites"
                  className="p-2 rounded-lg hover:bg-muted transition-colors text-foreground"
                  title="Saved Items"
                >
                  <Heart className="h-5 w-5" />
                </Link>
                <Link
                  href="/chats"
                  className="p-2 rounded-lg hover:bg-muted transition-colors text-foreground"
                  title="Campus Chats (WhatsApp Style)"
                >
                  <MessageCircle className="h-5 w-5" />
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
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition-colors shadow-sm"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Actions Header */}
          <div className="flex items-center gap-2 md:hidden">
            <Link
              href="/"
              className={cn(
                "p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted",
                pathname === "/" && "text-primary bg-primary/10"
              )}
              title="Home"
            >
              <Home className="h-5 w-5" />
            </Link>
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-foreground"
              aria-label="Toggle Navigation Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border py-4 space-y-3 animate-in slide-in-from-top-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search items by keyword..."
                defaultValue={currentQuery}
                onChange={(e) => {
                  const value = e.target.value;
                  setTimeout(() => updateSearch("q", value), 300);
                }}
                className="w-full rounded-lg border border-border bg-surface pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* User Campus Badge */}
            {user?.campus ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border text-xs font-semibold text-foreground">
                <School className="h-4 w-4 text-primary shrink-0" />
                <span>Your Campus: <strong className="text-primary">{user.campus.name}</strong></span>
              </div>
            ) : (
              <Link
                href="/register"
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-xs font-semibold text-primary"
                onClick={() => setMobileOpen(false)}
              >
                <span className="flex items-center gap-1.5">
                  <School className="h-4 w-4 shrink-0" />
                  Select your campus at registration
                </span>
                <span>Register →</span>
              </Link>
            )}

            {/* Links */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-border">
              <Link
                href="/"
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                onClick={() => setMobileOpen(false)}
              >
                <Home className="h-4 w-4 text-primary" /> Home Feed
              </Link>

              {user ? (
                <>
                  <Link
                    href="/listings/create"
                    className="flex items-center gap-2.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Plus className="h-4 w-4" /> Post a Listing
                  </Link>
                  <Link
                    href="/favorites"
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Heart className="h-4 w-4" /> My Saved Items
                  </Link>
                  <Link
                    href="/chats"
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                    onClick={() => setMobileOpen(false)}
                  >
                    <MessageCircle className="h-4 w-4 text-emerald-600" /> Chats & Messages
                  </Link>
                  <Link
                    href="/my-listings"
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Package className="h-4 w-4" /> My Active Listings
                  </Link>
                  <form action="/api/auth/logout" method="POST">
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-500/10"
                    >
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </form>
                </>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  <LogIn className="h-4 w-4" /> Sign In / Register
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
