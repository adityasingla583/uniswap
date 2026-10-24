import { z } from "zod";

export const CATEGORIES = [
  "BOOKS",
  "ELECTRONICS",
  "CYCLES_VEHICLES",
  "DORM_FURNITURE",
  "APPLIANCES",
  "CLOTHING",
  "SPORTS_FITNESS",
  "STATIONERY_LAB",
  "FREE",
  "SERVICES_TICKETS",
  "OTHER",
] as const;

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  campusId: z.string().min(1, "Please select a campus"),
  dormZone: z.string().optional(),
});

export const listingSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000),
  price: z.coerce.number().min(0, "Price must be 0 or more"),
  category: z.enum(CATEGORIES),
  imageUrl: z.string().url("Must be a valid image URL"),
  pickupSpot: z.string().min(3, "Pickup spot is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ListingInput = z.infer<typeof listingSchema>;
