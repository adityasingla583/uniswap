import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { pool } from "@/lib/prisma";
import { getUserMessageQuota } from "@/server/freemium-actions";
import { getUserVerificationStatus } from "@/server/payment-actions";
import { ProfileView } from "./profile-view";

export const metadata = {
  title: "Profile & Identity Verification | Local Loop",
  description: "Manage your campus profile, get verified student credibility badge, and view daily messaging quota.",
};

export default async function ProfilePage() {
  const session = await getSession();
  if (!session?.userId) {
    redirect("/login?from=/profile");
  }

  // 1. Fetch user profile
  const userRes = await pool.query<{
    id: string;
    name: string;
    email: string;
    phone: string | null;
    phoneVerified: boolean;
    isAdmin: boolean;
    isPremium: boolean;
    premiumUntil: Date | null;
    isVerified: boolean;
    verifiedAt: Date | null;
    campusId: string;
    campusName: string | null;
    dormZone: string | null;
    createdAt: Date;
  }>(
    `SELECT
       u.id, u.name, u.email, u.phone, u."phoneVerified", u."isAdmin",
       u."isPremium", u."premiumUntil", u."isVerified", u."verifiedAt",
       u."campusId", c.name as "campusName", u."dormZone", u."createdAt"
     FROM "User" u
     LEFT JOIN "Campus" c ON c.id = u."campusId"
     WHERE u.id = $1 LIMIT 1`,
    [session.userId]
  );

  const user = userRes.rows[0];
  if (!user) {
    redirect("/login");
  }

  // 2. Fetch daily message quota
  const quota = await getUserMessageQuota(user.id);

  // 3. Fetch verification status & payment records
  const verification = await getUserVerificationStatus(user.id);

  // 4. Fetch any campus registration requests submitted by this user
  const campusReqRes = await pool.query<{
    id: string;
    name: string;
    status: string;
    website: string | null;
    createdAt: Date;
  }>(
    `SELECT id, name, status, website, "createdAt"
     FROM "CampusRequest"
     WHERE "requesterEmail" = $1
     ORDER BY "createdAt" DESC
     LIMIT 5`,
    [user.email]
  );

  return (
    <ProfileView
      user={user}
      quota={quota}
      verification={verification}
      campusRequests={campusReqRes.rows}
    />
  );
}
