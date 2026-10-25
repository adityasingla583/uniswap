import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { hash } from "bcryptjs";
import { ALL_INDIAN_CAMPUSES } from "./institutes-data";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(`📡 Syncing ${ALL_INDIAN_CAMPUSES.length} Indian Premier Institutes into Supabase...`);

  const campusMap = new Map<string, any>();

  for (const c of ALL_INDIAN_CAMPUSES) {
    const record = await prisma.campus.upsert({
      where: { name: c.name },
      update: {
        latitude: c.latitude,
        longitude: c.longitude,
        domain: c.domain,
      },
      create: {
        name: c.name,
        latitude: c.latitude,
        longitude: c.longitude,
        domain: c.domain,
      },
    });
    campusMap.set(c.name, record);
  }

  console.log(`✅ Successfully synced ${campusMap.size} institutes into database!`);

  // Ensure IIIT Guwahati and IIT Guwahati test setup
  const iiitGuwahati = campusMap.get("IIIT Guwahati (Bongora)");
  const iitGuwahati = campusMap.get("IIT Guwahati (Guwahati)");

  if (iiitGuwahati && iitGuwahati) {
    console.log("\n📍 Setting up Guwahati Cluster (IIIT Guwahati <-> IIT Guwahati) for testing 50km radius...");
    const hashedPassword = await hash("password123", 12);

    // 1. IIIT Guwahati Student
    const iiitgUser = await prisma.user.upsert({
      where: { email: "student@iiitg.ac.in" },
      update: { campusId: iiitGuwahati.id, emailVerified: true },
      create: {
        name: "Debashis Nath (IIITG)",
        email: "student@iiitg.ac.in",
        password: hashedPassword,
        campusId: iiitGuwahati.id,
        dormZone: "Hostel Brahmaputra, IIITG",
        emailVerified: true,
      },
    });

    // 2. IIT Guwahati Student
    const iitgUser = await prisma.user.upsert({
      where: { email: "student@iitg.ac.in" },
      update: { campusId: iitGuwahati.id, emailVerified: true },
      create: {
        name: "Anupam Sarma (IITG)",
        email: "student@iitg.ac.in",
        password: hashedPassword,
        campusId: iitGuwahati.id,
        dormZone: "Umiam Hostel, IITG",
        emailVerified: true,
      },
    });

    // 3. Sample Listings at IIIT Guwahati
    const iiitgListingCount = await prisma.listing.count({ where: { campusId: iiitGuwahati.id } });
    if (iiitgListingCount === 0) {
      await prisma.listing.createMany({
        data: [
          {
            title: "Study Table & Wooden Chair (IIITG Hostel)",
            description: "Solid wood study desk with drawer and cushioned chair, great for hostel room.",
            price: 1200,
            category: "DORM_FURNITURE",
            imageUrl: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800",
            pickupSpot: "Hostel Brahmaputra Block A",
            latitude: iiitGuwahati.latitude,
            longitude: iiitGuwahati.longitude,
            campusId: iiitGuwahati.id,
            userId: iiitgUser.id,
          },
          {
            title: "Data Structures & Algorithms in C++ (Mark Allen Weiss)",
            description: "Used for 3rd semester CS course, clean pages with notes highlighted.",
            price: 350,
            category: "BOOKS",
            imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800",
            pickupSpot: "IIITG Academic Block Cafeteria",
            latitude: iiitGuwahati.latitude,
            longitude: iiitGuwahati.longitude,
            campusId: iiitGuwahati.id,
            userId: iiitgUser.id,
          },
        ],
      });
      console.log("Created sample listings for IIIT Guwahati");
    }

    // 4. Sample Listings at IIT Guwahati (~18.2 km from IIIT Guwahati)
    const iitgListingCount = await prisma.listing.count({ where: { campusId: iitGuwahati.id } });
    if (iitgListingCount === 0) {
      await prisma.listing.createMany({
        data: [
          {
            title: "Hero Sprint 21-Speed Gear Bicycle with U-Lock",
            description: "Well maintained mountain bike, dual disc brakes, great for campus commute.",
            price: 3200,
            category: "CYCLES_VEHICLES",
            imageUrl: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800",
            pickupSpot: "IIT Guwahati Main Gate / Umiam Hostel",
            latitude: iitGuwahati.latitude,
            longitude: iitGuwahati.longitude,
            campusId: iitGuwahati.id,
            userId: iitgUser.id,
          },
          {
            title: "Prestige 1.5L Electric Kettle (Hostel essential)",
            description: "Quick boiling, automatic cut-off, stainless steel body. Perfect condition.",
            price: 450,
            category: "APPLIANCES",
            imageUrl: "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=800",
            pickupSpot: "IITG Market Complex",
            latitude: iitGuwahati.latitude,
            longitude: iitGuwahati.longitude,
            campusId: iitGuwahati.id,
            userId: iitgUser.id,
          },
          {
            title: "Engineering Circuit Analysis - Hayt & Kemmerly (8th Ed)",
            description: "Complete book for electrical and electronics foundation course.",
            price: 400,
            category: "BOOKS",
            imageUrl: "https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=800",
            pickupSpot: "IITG Central Library lawn",
            latitude: iitGuwahati.latitude,
            longitude: iitGuwahati.longitude,
            campusId: iitGuwahati.id,
            userId: iitgUser.id,
          },
        ],
      });
      console.log("Created sample listings for IIT Guwahati");
    }
  }

  console.log("\n✨ Sync complete! All institutes and geological coordinates are active in database.");
}

main()
  .catch((e) => {
    console.error("Error syncing campuses:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
