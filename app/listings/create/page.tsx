import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateListingForm } from "./create-listing-form";

export const metadata = {
  title: "Create Listing | Local Loop",
  description: "Post a textbook, dorm item, or free giveaway on Local Loop",
};

export default async function CreateListingPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { campus: true },
  });

  if (!user) {
    redirect("/login");
  }

  return <CreateListingForm userCampusName={user.campus.name} />;
}
