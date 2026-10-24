import { Suspense } from "react";
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "./components/theme-provider";
import { Navbar } from "./components/navbar";
import { getCampuses } from "@/server/queries";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Local Loop | Hyper-Local Campus Marketplace",
  description:
    "Peer-to-peer campus marketplace for students to buy, sell, and giveaway textbooks, dorm gear, electronics, and more.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [campuses, session] = await Promise.all([
    getCampuses().catch(() => []),
    getSession().catch(() => null),
  ]);

  let user: { id: string; name: string } | null = null;
  if (session?.userId) {
    try {
      user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { id: true, name: true },
      });
    } catch {
      user = null;
    }
  }

  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors font-sans">
        <ThemeProvider>
          <Suspense fallback={<div className="h-16 border-b border-border bg-surface/80" />}>
            <Navbar campuses={campuses} user={user} />
          </Suspense>
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          <footer className="border-t border-border bg-surface/50 py-6 mt-12 text-center text-xs text-muted-foreground">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p>© {new Date().getFullYear()} Local Loop — Campus P2P Marketplace</p>
              <p>Built for hyper-localized student exchange with Supabase & Prisma</p>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
