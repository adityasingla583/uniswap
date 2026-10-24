import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { hash } from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clean existing data
  await prisma.favorite.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.user.deleteMany();
  await prisma.campus.deleteMany();

  // Create campuses
  const mit = await prisma.campus.create({
    data: {
      name: "MIT Cambridge",
      latitude: 42.3601,
      longitude: -71.0942,
      domain: "mit.edu",
    },
  });

  const harvard = await prisma.campus.create({
    data: {
      name: "Harvard University",
      latitude: 42.3770,
      longitude: -71.1167,
      domain: "harvard.edu",
    },
  });

  // Create users
  const hashedPassword = await hash("password123", 12);

  const alice = await prisma.user.create({
    data: {
      name: "Alice Chen",
      email: "alice@mit.edu",
      password: hashedPassword,
      campusId: mit.id,
      dormZone: "East Campus",
    },
  });

  const bob = await prisma.user.create({
    data: {
      name: "Bob Smith",
      email: "bob@harvard.edu",
      password: hashedPassword,
      campusId: harvard.id,
      dormZone: "Adams House",
    },
  });

  const charlie = await prisma.user.create({
    data: {
      name: "Charlie Park",
      email: "charlie@mit.edu",
      password: hashedPassword,
      campusId: mit.id,
      dormZone: "Next House",
    },
  });

  const diana = await prisma.user.create({
    data: {
      name: "Diana Lee",
      email: "diana@harvard.edu",
      password: hashedPassword,
      campusId: harvard.id,
      dormZone: "Dunster House",
    },
  });

  // MIT Listings
  const mitListings = [
    {
      title: "Calculus Early Transcendentals 8th Ed",
      description: "Stewart calculus textbook, lightly highlighted. Perfect for 18.01/18.02. Some notes in margins but all pages intact.",
      price: 45.0,
      category: "BOOKS" as const,
      imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400",
      pickupSpot: "Hayden Library",
      latitude: 42.3592,
      longitude: -71.0927,
      campusId: mit.id,
      userId: alice.id,
    },
    {
      title: "Desk Lamp - LED Adjustable",
      description: "Great desk lamp for late-night study sessions. USB charging port built in. Barely used for one semester.",
      price: 15.0,
      category: "ELECTRONICS" as const,
      imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=400",
      pickupSpot: "Student Center",
      latitude: 42.3598,
      longitude: -71.0951,
      campusId: mit.id,
      userId: alice.id,
    },
    {
      title: "Mini Fridge - Compact 3.2 Cu Ft",
      description: "Perfect dorm fridge. Works great, very clean. Moving out and can't take it with me. Pick up anytime.",
      price: 60.0,
      category: "FURNITURE" as const,
      imageUrl: "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400",
      pickupSpot: "East Campus Courtyard",
      latitude: 42.3604,
      longitude: -71.0893,
      campusId: mit.id,
      userId: charlie.id,
    },
    {
      title: "Introduction to Algorithms (CLRS)",
      description: "The classic CLRS algorithms textbook, 4th edition. Essential for 6.006. No markings, like new condition.",
      price: 55.0,
      category: "BOOKS" as const,
      imageUrl: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400",
      pickupSpot: "Stata Center Lobby",
      latitude: 42.3616,
      longitude: -71.0906,
      campusId: mit.id,
      userId: charlie.id,
    },
    {
      title: "MIT Hoodie - Size M (Free!)",
      description: "Giving away an MIT hoodie, size Medium. Has a small stain on the sleeve but still wearable. Free to a good home!",
      price: 0.0,
      category: "FREE" as const,
      imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400",
      pickupSpot: "Main Gate",
      latitude: 42.3601,
      longitude: -71.0942,
      campusId: mit.id,
      userId: alice.id,
    },
    {
      title: "TI-84 Plus CE Graphing Calculator",
      description: "TI-84 Plus CE in great condition with charging cable. All functions work perfectly. Great for math and physics courses.",
      price: 70.0,
      category: "ELECTRONICS" as const,
      imageUrl: "https://images.unsplash.com/photo-1564466809058-bf4114d55352?w=400",
      pickupSpot: "Building 10 Lobby",
      latitude: 42.3593,
      longitude: -71.0935,
      campusId: mit.id,
      userId: charlie.id,
    },
    {
      title: "Ergonomic Desk Chair",
      description: "Adjustable height desk chair with lumbar support. Used for 2 semesters. Some wear on armrests but very comfortable.",
      price: 40.0,
      category: "FURNITURE" as const,
      imageUrl: "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=400",
      pickupSpot: "Next House Loading Dock",
      latitude: 42.3546,
      longitude: -71.1024,
      campusId: mit.id,
      userId: charlie.id,
    },
    {
      title: "Physics Lecture Notes Bundle (Free)",
      description: "Complete set of 8.01 and 8.02 lecture notes, neatly organized. Free for any physics student who wants them!",
      price: 0.0,
      category: "FREE" as const,
      imageUrl: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400",
      pickupSpot: "Campus Library",
      latitude: 42.3592,
      longitude: -71.0927,
      campusId: mit.id,
      userId: alice.id,
    },
    {
      title: "Bluetooth Speaker - JBL Flip 5",
      description: "Portable bluetooth speaker, great sound quality. Battery lasts about 8 hours. Minor scratches on bottom.",
      price: 35.0,
      category: "ELECTRONICS" as const,
      imageUrl: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400",
      pickupSpot: "Student Center",
      latitude: 42.3598,
      longitude: -71.0951,
      campusId: mit.id,
      userId: charlie.id,
    },
    {
      title: "Winter Jacket - North Face Size L",
      description: "North Face winter jacket, men's size Large. Very warm, perfect for Boston winters. Selling because I got a new one.",
      price: 50.0,
      category: "CLOTHING" as const,
      imageUrl: "https://images.unsplash.com/photo-1544923246-77307dd270b9?w=400",
      pickupSpot: "Main Gate",
      latitude: 42.3601,
      longitude: -71.0942,
      campusId: mit.id,
      userId: alice.id,
    },
  ];

  // Harvard Listings
  const harvardListings = [
    {
      title: "Organic Chemistry Textbook",
      description: "Clayden Organic Chemistry, 2nd edition. Some highlighting but in great shape. Essential for Chem 27.",
      price: 40.0,
      category: "BOOKS" as const,
      imageUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400",
      pickupSpot: "Widener Library",
      latitude: 42.3737,
      longitude: -71.1165,
      campusId: harvard.id,
      userId: bob.id,
    },
    {
      title: "Standing Desk Converter",
      description: "Adjustable standing desk converter that sits on top of any desk. Great for ergonomic studying. Height adjustable.",
      price: 85.0,
      category: "FURNITURE" as const,
      imageUrl: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400",
      pickupSpot: "Science Center",
      latitude: 42.3765,
      longitude: -71.1163,
      campusId: harvard.id,
      userId: bob.id,
    },
    {
      title: "MacBook Charger 67W USB-C",
      description: "Original Apple 67W USB-C charger. Works perfectly, just upgraded to a newer MacBook that uses different wattage.",
      price: 25.0,
      category: "ELECTRONICS" as const,
      imageUrl: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400",
      pickupSpot: "Adams House",
      latitude: 42.3725,
      longitude: -71.1189,
      campusId: harvard.id,
      userId: diana.id,
    },
    {
      title: "Harvard Crimson Scarf (Free)",
      description: "Official Harvard crimson scarf from the campus store. Giving it away - already have too many! Great condition.",
      price: 0.0,
      category: "FREE" as const,
      imageUrl: "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=400",
      pickupSpot: "Harvard Yard",
      latitude: 42.3744,
      longitude: -71.1169,
      campusId: harvard.id,
      userId: bob.id,
    },
    {
      title: "Microeconomics: Theory and Applications",
      description: "Perloff microeconomics textbook, latest edition. Clean copy, no highlights. Used for Econ 1010a.",
      price: 35.0,
      category: "BOOKS" as const,
      imageUrl: "https://images.unsplash.com/photo-1553729459-afe8f2e2ed65?w=400",
      pickupSpot: "Lamont Library",
      latitude: 42.3727,
      longitude: -71.1153,
      campusId: harvard.id,
      userId: diana.id,
    },
    {
      title: "Dorm Rug 5x7 - Navy Blue",
      description: "Soft area rug, 5x7 feet, navy blue. Perfect for dorm rooms. Very clean, no stains. Rolled up and ready to go.",
      price: 20.0,
      category: "FURNITURE" as const,
      imageUrl: "https://images.unsplash.com/photo-1600166898405-da9535204843?w=400",
      pickupSpot: "Dunster House",
      latitude: 42.3691,
      longitude: -71.1188,
      campusId: harvard.id,
      userId: diana.id,
    },
    {
      title: "Sony WH-1000XM4 Headphones",
      description: "Sony noise-canceling headphones in excellent condition. Includes original case and all cables. Battery holds 25+ hours.",
      price: 120.0,
      category: "ELECTRONICS" as const,
      imageUrl: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400",
      pickupSpot: "Science Center",
      latitude: 42.3765,
      longitude: -71.1163,
      campusId: harvard.id,
      userId: bob.id,
    },
    {
      title: "Rain Boots Size 8 (Free)",
      description: "Women's rain boots, size 8. A bit scuffed but fully waterproof. Free - just need them gone before move-out!",
      price: 0.0,
      category: "FREE" as const,
      imageUrl: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400",
      pickupSpot: "Harvard Square",
      latitude: 42.3735,
      longitude: -71.1189,
      campusId: harvard.id,
      userId: diana.id,
    },
    {
      title: "Bedside Table with Drawer",
      description: "Small wooden bedside table with one drawer. Solid construction. Minor scratches on top. Easy to carry.",
      price: 25.0,
      category: "FURNITURE" as const,
      imageUrl: "https://images.unsplash.com/photo-1532372576444-dda954194ad0?w=400",
      pickupSpot: "Adams House",
      latitude: 42.3725,
      longitude: -71.1189,
      campusId: harvard.id,
      userId: bob.id,
    },
    {
      title: "Python Data Science Handbook",
      description: "Jake VanderPlas Python Data Science Handbook. Great reference for CS109. Like new, never highlighted.",
      price: 30.0,
      category: "BOOKS" as const,
      imageUrl: "https://images.unsplash.com/photo-1515879218367-8466d910auj7?w=400",
      pickupSpot: "Maxwell Dworkin",
      latitude: 42.3789,
      longitude: -71.1174,
      campusId: harvard.id,
      userId: diana.id,
    },
  ];

  for (const listing of mitListings) {
    await prisma.listing.create({ data: listing });
  }

  for (const listing of harvardListings) {
    await prisma.listing.create({ data: listing });
  }

  console.log("✅ Seed data created successfully!");
  console.log(`   - 2 campuses (MIT, Harvard)`);
  console.log(`   - 4 users`);
  console.log(`   - ${mitListings.length + harvardListings.length} listings`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
