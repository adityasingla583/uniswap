"use server";

import { prisma } from "@/lib/prisma";
import { getSession, createSession, deleteSession } from "@/lib/auth";
import { loginSchema, registerSchema, listingSchema } from "@/lib/validations";
import { hash, compare } from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// ─── Auth Actions ───────────────────────────────────────────────

export async function login(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Validation failed" };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (!user) {
    return { error: "Invalid email or password" };
  }

  const valid = await compare(parsed.data.password, user.password);
  if (!valid) {
    return { error: "Invalid email or password" };
  }

  await createSession(user.id);
  redirect("/");
}

export async function register(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    campusId: formData.get("campusId"),
    dormZone: formData.get("dormZone") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Validation failed" };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (existing) {
    return { error: "An account with this email already exists" };
  }

  const hashedPassword = await hash(parsed.data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password: hashedPassword,
      campusId: parsed.data.campusId,
      dormZone: parsed.data.dormZone,
    },
  });

  await createSession(user.id);
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

// ─── Listing Actions ────────────────────────────────────────────

export async function createListing(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const session = await getSession();
  if (!session) {
    return { error: "You must be logged in to create a listing" };
  }

  const parsed = listingSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    price: formData.get("price"),
    category: formData.get("category"),
    imageUrl: formData.get("imageUrl"),
    pickupSpot: formData.get("pickupSpot"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Validation failed" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { campus: true },
  });

  if (!user) {
    return { error: "User not found" };
  }

  await prisma.listing.create({
    data: {
      ...parsed.data,
      latitude: user.campus.latitude,
      longitude: user.campus.longitude,
      campusId: user.campusId,
      userId: user.id,
    },
  });

  revalidatePath("/");
  revalidatePath("/my-listings");
  redirect("/my-listings");
}

export async function updateListingStatus(listingId: string, status: "AVAILABLE" | "RESERVED" | "SOLD") {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
  });

  if (!listing || listing.userId !== session.userId) {
    return { error: "Not authorized" };
  }

  await prisma.listing.update({
    where: { id: listingId },
    data: { status },
  });

  revalidatePath("/");
  revalidatePath("/my-listings");
  revalidatePath(`/listings/${listingId}`);
}

export async function deleteListing(listingId: string) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
  });

  if (!listing || listing.userId !== session.userId) {
    return { error: "Not authorized" };
  }

  await prisma.listing.delete({
    where: { id: listingId },
  });

  revalidatePath("/");
  revalidatePath("/my-listings");
}

// ─── Favorite Actions ───────────────────────────────────────────

export async function toggleFavorite(listingId: string) {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  const existing = await prisma.favorite.findUnique({
    where: {
      userId_listingId: {
        userId: session.userId,
        listingId,
      },
    },
  });

  if (existing) {
    await prisma.favorite.delete({
      where: { id: existing.id },
    });
  } else {
    await prisma.favorite.create({
      data: {
        userId: session.userId,
        listingId,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/favorites");
  revalidatePath(`/listings/${listingId}`);
}
