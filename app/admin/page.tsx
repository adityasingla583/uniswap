import { redirect } from "next/navigation";
import { getAdminDashboardData, verifyAdminSession } from "@/server/campus-actions";
import { AdminCampusManager } from "./admin-campus-manager";
import {
  ShieldAlert,
  School,
  Users,
  Package,
  Bell,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Admin Dashboard | Local Loop",
  description: "Platform owner & admin controls, campus verification requests, and marketplace metrics",
};

export default async function AdminPage() {
  const auth = await verifyAdminSession();
  if (!auth.isAdmin || !auth.user) {
    redirect("/login");
  }

  const data = await getAdminDashboardData();
  if (data.error || !data.metrics) {
    redirect("/");
  }

  const { metrics, pendingRequests, recentRequests } = data;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Campus Feed
        </Link>
        <span className="text-xs text-muted-foreground">
          Logged in as: <strong className="text-foreground">{auth.user.email}</strong>
        </span>
      </div>

      {/* Main Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-amber-500/15 via-primary/10 to-card border border-amber-500/30 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                Admin Control Dashboard
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white font-extrabold text-[10px] uppercase tracking-wider">
                Owner Verified
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Verify pending institute requests, monitor anti-sybil accounts, and oversee campus marketplace activity.
            </p>
          </div>
        </div>

        {/* Notifications Alert Pill */}
        {metrics.pendingCount > 0 && (
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 shrink-0 animate-in fade-in-0">
            <Bell className="h-4 w-4 animate-bounce shrink-0" />
            <div className="text-xs">
              <span className="font-bold">{metrics.pendingCount} New Request{metrics.pendingCount > 1 ? "s" : ""}</span>
              <p className="text-[10px] opacity-80">Pending your confirmation</p>
            </div>
          </div>
        )}
      </div>

      {/* Overview Stat Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Active Campuses</span>
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <School className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-foreground">
            {metrics.totalCampuses}
          </div>
          <p className="text-[11px] text-muted-foreground">IITs, NITs, IIITs & universities</p>
        </div>

        {/* Metric 2 */}
        <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Verified Students</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-foreground">
            {metrics.totalUsers}
          </div>
          <p className="text-[11px] text-muted-foreground">Anti-Sybil protected accounts</p>
        </div>

        {/* Metric 3 */}
        <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Total Listings</span>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-foreground">
            {metrics.totalListings}
          </div>
          <p className="text-[11px] text-muted-foreground">P2P items currently listed</p>
        </div>

        {/* Metric 4 */}
        <div
          className={`p-4 sm:p-5 rounded-2xl border shadow-xs space-y-2 ${
            metrics.pendingCount > 0
              ? "border-amber-500/50 bg-amber-500/5"
              : "border-border bg-card"
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Pending Requests</span>
            <div
              className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                metrics.pendingCount > 0
                  ? "bg-amber-500 text-white font-bold"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <Bell className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-foreground">
            {metrics.pendingCount}
          </div>
          <p className="text-[11px] text-muted-foreground">Awaiting admin review</p>
        </div>
      </div>

      {/* Campus Approvals & Verification Manager */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            Campus Verification & Confirmation Queue
          </h2>
          <p className="text-xs text-muted-foreground">
            When a student requests an institute not currently on Local Loop, review their coordinates and confirm to activate it across all search filters and registration.
          </p>
        </div>

        <AdminCampusManager
          initialPending={pendingRequests}
          initialRecent={recentRequests}
        />
      </div>
    </div>
  );
}
