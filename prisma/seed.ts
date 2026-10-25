import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { hash } from "bcryptjs";
import { ALL_INDIAN_CAMPUSES } from "./institutes-data";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const INDIAN_CAMPUSES = ALL_INDIAN_CAMPUSES;

async function main() {
  console.log("🌱 Starting seed script for Indian campuses & localized items...");

  // Clean existing data
  await prisma.favorite.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.user.deleteMany();
  await prisma.campus.deleteMany();

  // Create Indian Campuses
  const createdCampuses = new Map<string, any>();
  for (const c of INDIAN_CAMPUSES) {
    const record = await prisma.campus.create({ data: c });
    createdCampuses.set(c.name, record);
  }

  const iitb = createdCampuses.get("IIT Bombay (Mumbai)");
  const iitd = createdCampuses.get("IIT Delhi (New Delhi)");
  const iitm = createdCampuses.get("IIT Madras (Chennai)");
  const duNorth = createdCampuses.get("Delhi University - North Campus");

  // Create test users
  const hashedPassword = await hash("password123", 12);

  const aarav = await prisma.user.create({
    data: {
      name: "Aarav Sharma",
      email: "aarav@iitb.ac.in",
      password: hashedPassword,
      campusId: iitb.id,
      dormZone: "Hostel 14 (H14)",
    },
  });

  const priya = await prisma.user.create({
    data: {
      name: "Priya Verma",
      email: "priya@iitd.ac.in",
      password: hashedPassword,
      campusId: iitd.id,
      dormZone: "Kailash Hostel",
    },
  });

  const rohit = await prisma.user.create({
    data: {
      name: "Rohit Iyer",
      email: "rohit@iitm.ac.in",
      password: hashedPassword,
      campusId: iitm.id,
      dormZone: "Alakananda Hostel",
    },
  });

  const ananya = await prisma.user.create({
    data: {
      name: "Ananya Kapoor",
      email: "ananya@du.ac.in",
      password: hashedPassword,
      campusId: duNorth.id,
      dormZone: "Miranda House PG",
    },
  });

  // Listings covering all categories with Indian Rupees (₹)
  const sampleListings = [
    // Cycles & Vehicles
    {
      title: "Hero Sprint Pro 21-Speed Gear Bicycle",
      description: "Great condition geared cycle. Dual disc brakes, new front tyre, comfortable gel seat. Perfect for commuting between hostels and lecture hall complex. Lock included free.",
      price: 3499.0,
      category: "CYCLES_VEHICLES" as const,
      imageUrl: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600",
      pickupSpot: "Hostel 14 Cycle Stand / SAC",
      latitude: 19.1334,
      longitude: 72.9133,
      campusId: iitb.id,
      userId: aarav.id,
    },
    {
      title: "Steelbird Full-Face Helmet (Medium)",
      description: "ISI certified helmet, quick release buckle, smoke visor. Used for 4 months, pristine interior padding. Selling because graduating.",
      price: 799.0,
      category: "CYCLES_VEHICLES" as const,
      imageUrl: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600",
      pickupSpot: "Main Gate Security Post",
      latitude: 28.5450,
      longitude: 77.1926,
      campusId: iitd.id,
      userId: priya.id,
    },

    // Books & Study Material
    {
      title: "Concepts of Physics by HC Verma (Vol 1 & 2)",
      description: "Must-have classic physics reference. Crisp pages, no pen scribble, formula cheat sheets included. Both volumes bundled together.",
      price: 450.0,
      category: "BOOKS" as const,
      imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600",
      pickupSpot: "Central Library Steps",
      latitude: 19.1340,
      longitude: 72.9140,
      campusId: iitb.id,
      userId: aarav.id,
    },
    {
      title: "Introduction to Algorithms (CLRS) - Indian Edition",
      description: "The definitive algorithms textbook. Very clean copy with minimal pencil notes in Chapter 4 & 15. Saved me during placements!",
      price: 850.0,
      category: "BOOKS" as const,
      imageUrl: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600",
      pickupSpot: "Bharti Building Lobby",
      latitude: 28.5455,
      longitude: 77.1930,
      campusId: iitd.id,
      userId: priya.id,
    },
    {
      title: "Higher Engineering Mathematics by B.S. Grewal",
      description: "Standard math text for 1st & 2nd year engineering. 44th Edition in hardcover. All formulas highlighted neatly.",
      price: 499.0,
      category: "BOOKS" as const,
      imageUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600",
      pickupSpot: "DoMS Library / Gajendra Circle",
      latitude: 12.9915,
      longitude: 80.2337,
      campusId: iitm.id,
      userId: rohit.id,
    },

    // Electronics & Gadgets
    {
      title: "Casio fx-991EX ClassWiz Scientific Calculator",
      description: "Allowed in university examinations. High resolution display, 552 functions including matrix and vector calculations. Comes with original protective slide case.",
      price: 850.0,
      category: "ELECTRONICS" as const,
      imageUrl: "https://images.unsplash.com/photo-1564466809058-bf4114d55352?w=600",
      pickupSpot: "Gymkhana Grounds",
      latitude: 19.1330,
      longitude: 72.9125,
      campusId: iitb.id,
      userId: aarav.id,
    },
    {
      title: "boAt Rockerz 450 Bluetooth Headphones",
      description: "Lush bass, 15 hours battery life on single charge, ultra-plush ear cups. In matte black with charging cable and aux cable.",
      price: 699.0,
      category: "ELECTRONICS" as const,
      imageUrl: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600",
      pickupSpot: "Vindhyachal Hostel Canteen",
      latitude: 28.5445,
      longitude: 77.1920,
      campusId: iitd.id,
      userId: priya.id,
    },
    {
      title: "Mi 20000mAh Power Bank 3i (18W Fast Charging)",
      description: "Triple port output with Power Delivery. Charges a laptop or phone easily during long library study marathons. 100% genuine.",
      price: 950.0,
      category: "ELECTRONICS" as const,
      imageUrl: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600",
      pickupSpot: "Arts Faculty Gate No. 4",
      latitude: 28.6904,
      longitude: 77.2120,
      campusId: duNorth.id,
      userId: ananya.id,
    },

    // Dorm Furniture
    {
      title: "Wakefit 4-Inch High Resilient Foam Single Mattress",
      description: "Single bed dorm mattress (72x36 inches). Removable washable cover, sanitized regularly, very supportive for the back. No sags.",
      price: 1800.0,
      category: "DORM_FURNITURE" as const,
      imageUrl: "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600",
      pickupSpot: "Hostel 14 Wing A",
      latitude: 19.1334,
      longitude: 72.9133,
      campusId: iitb.id,
      userId: aarav.id,
    },
    {
      title: "Foldable Wooden Laptop Table for Bed",
      description: "Includes tablet holder, cup slot, and drawer. Lightweight, easily stored under the cot. Ideal for late-night hostel binge or assignments.",
      price: 350.0,
      category: "DORM_FURNITURE" as const,
      imageUrl: "https://images.unsplash.com/photo-1532372576444-dda954194ad0?w=600",
      pickupSpot: "Kailash Gate",
      latitude: 28.5450,
      longitude: 77.1926,
      campusId: iitd.id,
      userId: priya.id,
    },

    // Appliances
    {
      title: "Pigeon 1.5 Litre Electric Kettle (1500W)",
      description: "Hostel lifesaver for Maggi, coffee, and late night green tea. Automatic shutoff with stainless steel body. Works like a charm.",
      price: 499.0,
      category: "APPLIANCES" as const,
      imageUrl: "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=600",
      pickupSpot: "Himalaya Mess / Canteen",
      latitude: 12.9920,
      longitude: 80.2340,
      campusId: iitm.id,
      userId: rohit.id,
    },
    {
      title: "Bajaj 300mm High-Speed Table Fan",
      description: "Powerful air delivery with silent operation. Kept my room cool through Delhi summer. Cleaned and oiled last week.",
      price: 850.0,
      category: "APPLIANCES" as const,
      imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=600",
      pickupSpot: "Miranda House Gate",
      latitude: 28.6910,
      longitude: 77.2115,
      campusId: duNorth.id,
      userId: ananya.id,
    },

    // Clothing & Lab Apparel
    {
      title: "White Cotton Chemistry Lab Coat (Unisex M)",
      description: "Full sleeve 100% thick white cotton lab coat with deep pockets. Required for Chemistry & Bio lab courses. Freshly dry-cleaned.",
      price: 199.0,
      category: "CLOTHING" as const,
      imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600",
      pickupSpot: "Department of Chemistry Foyer",
      latitude: 19.1338,
      longitude: 72.9130,
      campusId: iitb.id,
      userId: aarav.id,
    },
    {
      title: "IIT Delhi Technical Fest T-Shirt & Hoodie (L)",
      description: "Rendezvous / Tryst official black hoodie, size Large. High density fleece, very warm for North Indian campus winters.",
      price: 550.0,
      category: "CLOTHING" as const,
      imageUrl: "https://images.unsplash.com/photo-1544923246-77307dd270b9?w=600",
      pickupSpot: "Student Activity Center (SAC)",
      latitude: 28.5448,
      longitude: 77.1922,
      campusId: iitd.id,
      userId: priya.id,
    },

    // Sports & Fitness
    {
      title: "Yonex Nanoray 7000I Badminton Racket + Full Cover",
      description: "Graphite shaft, high tension gutting (24 lbs). Lightweight and lethal for smashes in hostel court. Minor rim scratches only.",
      price: 899.0,
      category: "SPORTS_FITNESS" as const,
      imageUrl: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600",
      pickupSpot: "Indoor Badminton Court",
      latitude: 12.9910,
      longitude: 80.2330,
      campusId: iitm.id,
      userId: rohit.id,
    },
    {
      title: "Nivia Storm Size-5 Football (FIFA Spec)",
      description: "32 panel machine stitched rubberized ball. Excellent bounce on turf and grass. Used only 3 times during inter-hostel tournament.",
      price: 399.0,
      category: "SPORTS_FITNESS" as const,
      imageUrl: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600",
      pickupSpot: "Rugby Grounds / Main Field",
      latitude: 28.5460,
      longitude: 77.1935,
      campusId: iitd.id,
      userId: priya.id,
    },

    // Stationery & Lab Tools
    {
      title: "Omega Engineering Mini Drafter with Storage Bag",
      description: "Essential for 1st Year Engineering Graphics / Drawing. Steel arms, unbreakable scale, clamps securely on drawing boards.",
      price: 299.0,
      category: "STATIONERY_LAB" as const,
      imageUrl: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600",
      pickupSpot: "Drawing Hall / Central Workshop",
      latitude: 19.1335,
      longitude: 72.9128,
      campusId: iitb.id,
      userId: aarav.id,
    },

    // Services & Tickets
    {
      title: "Shared Airport Cab to Mumbai T2 (Friday 6 AM)",
      description: "Booked a Prime Sedan from Powai campus to Mumbai T2 for Diwali break. Looking for 2 students to share fare (₹250 each).",
      price: 250.0,
      category: "SERVICES_TICKETS" as const,
      imageUrl: "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=600",
      pickupSpot: "Main Gate Security",
      latitude: 19.1334,
      longitude: 72.9133,
      campusId: iitb.id,
      userId: aarav.id,
    },

    // Free Giveaways (₹0)
    {
      title: "GATE CSE 15 Years Solved Papers Booklet (Free!)",
      description: "Made Easy chapterwise solved papers with mock test keys. Passing on to any 3rd/4th year student preparing for GATE. Take it for free!",
      price: 0.0,
      category: "FREE" as const,
      imageUrl: "https://images.unsplash.com/photo-1553729459-afe8f2e2ed65?w=600",
      pickupSpot: "Library Quadrangle",
      latitude: 28.5450,
      longitude: 77.1926,
      campusId: iitd.id,
      userId: priya.id,
    },
    {
      title: "Dorm Curtains & Warm LED Fairy Lights (Free!)",
      description: "Pair of 7-foot thick navy blue curtains with ring eyelets, plus 10 meters warm yellow fairy lights. Free for incoming fresher!",
      price: 0.0,
      category: "FREE" as const,
      imageUrl: "https://images.unsplash.com/photo-1600166898405-da9535204843?w=600",
      pickupSpot: "Miranda House Reception",
      latitude: 28.6904,
      longitude: 77.2120,
      campusId: duNorth.id,
      userId: ananya.id,
    },
  ];

  for (const item of sampleListings) {
    await prisma.listing.create({ data: item });
  }

  console.log("✅ Seed data populated successfully!");
  console.log(`   - ${INDIAN_CAMPUSES.length} Indian premier campuses`);
  console.log(`   - 4 student demo accounts`);
  console.log(`   - ${sampleListings.length} listings in ₹ across all expanded categories`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
