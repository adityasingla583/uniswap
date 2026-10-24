import { Suspense } from "react";
import { getCampuses } from "@/server/queries";
import { RegisterForm } from "./register-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Register | Local Loop",
  description: "Create an account to join your campus marketplace",
};

export default async function RegisterPage() {
  const campuses = await getCampuses();
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center text-sm text-muted-foreground">Loading registration...</div>}>
      <RegisterForm campuses={campuses} />
    </Suspense>
  );
}
