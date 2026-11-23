import { Suspense } from "react";
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "./components/theme-provider";
import { Navbar } from "./components/navbar";
import { getSession } from "@/lib/auth";
import { prisma, pool } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Local Loop | Hyper-Local Campus Marketplace",
  description:
    "Peer-to-peer campus marketplace for students to buy, sell, and giveaway textbooks, dorm gear, electronics, and more.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession().catch(() => null);

  let user: {
    id: string;
    name: string;
    email?: string;
    isAdmin?: boolean;
    campusId: string;
    campus: { id: string; name: string };
  } | null = null;
  let pendingAdminNotifications = 0;

  if (session?.userId) {
    try {
      const res = await pool.query<{
        id: string;
        name: string;
        email: string;
        isAdmin: boolean;
        campusId: string;
        campusName: string | null;
      }>(
        `SELECT u.id, u.name, u.email, u."isAdmin", u."campusId", c.name as "campusName"
         FROM "User" u
         LEFT JOIN "Campus" c ON c.id = u."campusId"
         WHERE u.id = $1 LIMIT 1`,
        [session.userId]
      );

      const row = res.rows[0];
      if (row) {
        const emailLower = (row.email || "").toLowerCase();
        const isMasterAdmin =
          row.isAdmin ||
          emailLower === "adityasingla03583@gmail.com" ||
          emailLower === "aditysasingla03583@gmail.com";

        user = {
          id: row.id,
          name: row.name,
          email: row.email,
          isAdmin: isMasterAdmin,
          campusId: row.campusId,
          campus: { id: row.campusId, name: row.campusName || "Campus" },
        };

        if (isMasterAdmin) {
          const countRes = await pool.query<{ count: string }>(
            `SELECT count(*) FROM "CampusRequest" WHERE status = 'PENDING'`
          );
          pendingAdminNotifications = parseInt(countRes.rows[0]?.count || "0", 10);
        }
      }
    } catch {
      user = null;
    }
  }

  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors font-sans">
        <ThemeProvider>
          <Suspense fallback={<div className="h-16 border-b border-border bg-surface/80" />}>
            <Navbar user={user} pendingAdminNotifications={pendingAdminNotifications} />
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
