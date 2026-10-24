import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { hash } from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const INDIAN_CAMPUSES = [
  // IITs
  { name: "IIT Bombay (Mumbai)", latitude: 19.1334, longitude: 72.9133, domain: "iitb.ac.in" },
  { name: "IIT Delhi (New Delhi)", latitude: 28.5450, longitude: 77.1926, domain: "iitd.ac.in" },
  { name: "IIT Madras (Chennai)", latitude: 12.9915, longitude: 80.2337, domain: "iitm.ac.in" },
  { name: "IIT Kanpur (Kanpur)", latitude: 26.5123, longitude: 80.2329, domain: "iitk.ac.in" },
  { name: "IIT Kharagpur (Kharagpur)", latitude: 22.3149, longitude: 87.3105, domain: "iitkgp.ac.in" },
  { name: "IIT Roorkee (Roorkee)", latitude: 29.8649, longitude: 77.8965, domain: "iitr.ac.in" },
  { name: "IIT Guwahati (Guwahati)", latitude: 26.1878, longitude: 91.6916, domain: "iitg.ac.in" },
  { name: "IIT BHU (Varanasi)", latitude: 25.2677, longitude: 82.9913, domain: "itbhu.ac.in" },
  { name: "IIT Hyderabad (Kandi)", latitude: 17.5947, longitude: 78.1230, domain: "iith.ac.in" },
  { name: "IIT Indore (Simrol)", latitude: 22.5204, longitude: 75.9207, domain: "iiti.ac.in" },
  { name: "IIT Gandhinagar (Palaj)", latitude: 23.2114, longitude: 72.6842, domain: "iitgn.ac.in" },
  { name: "IIT Ropar (Rupnagar)", latitude: 30.9678, longitude: 76.4732, domain: "iitrpr.ac.in" },

  // IISc & BITS
  { name: "IISc Bangalore (Bengaluru)", latitude: 13.0219, longitude: 77.5671, domain: "iisc.ac.in" },
  { name: "BITS Pilani (Pilani Campus)", latitude: 28.3639, longitude: 75.5870, domain: "pilani.bits-pilani.ac.in" },
  { name: "BITS Pilani (Goa Campus)", latitude: 15.3911, longitude: 73.8783, domain: "goa.bits-pilani.ac.in" },
  { name: "BITS Pilani (Hyderabad Campus)", latitude: 17.5449, longitude: 78.5718, domain: "hyderabad.bits-pilani.ac.in" },

  // NITs
  { name: "NIT Trichy (Tiruchirappalli)", latitude: 10.7589, longitude: 78.8132, domain: "nitt.edu" },
  { name: "NIT Surathkal (Mangalore)", latitude: 13.0108, longitude: 74.7943, domain: "nitk.edu.in" },
  { name: "NIT Warangal (Warangal)", latitude: 17.9835, longitude: 79.5308, domain: "nitw.ac.in" },
  { name: "NIT Rourkela (Rourkela)", latitude: 22.2531, longitude: 84.9011, domain: "nitrkl.ac.in" },
  { name: "NIT Calicut (Kozhikode)", latitude: 11.3216, longitude: 75.9336, domain: "nitc.ac.in" },
  { name: "VNIT Nagpur (Nagpur)", latitude: 21.1234, longitude: 79.0514, domain: "vnit.ac.in" },
  { name: "MNIT Jaipur (Jaipur)", latitude: 26.8637, longitude: 75.8115, domain: "mnit.ac.in" },
  { name: "MNNIT Allahabad (Prayagraj)", latitude: 25.4921, longitude: 81.8667, domain: "mnnit.ac.in" },

  // IIMs
  { name: "IIM Ahmedabad (Ahmedabad)", latitude: 23.0315, longitude: 72.5314, domain: "iima.ac.in" },
  { name: "IIM Bangalore (Bengaluru)", latitude: 12.8953, longitude: 77.5996, domain: "iimb.ac.in" },
  { name: "IIM Calcutta (Kolkata)", latitude: 22.4384, longitude: 88.3075, domain: "iimcal.ac.in" },
  { name: "IIM Lucknow (Lucknow)", latitude: 26.9248, longitude: 80.9329, domain: "iiml.ac.in" },
  { name: "IIM Kozhikode (Kozhikode)", latitude: 11.2858, longitude: 75.8770, domain: "iimk.ac.in" },
  { name: "IIM Indore (Indore)", latitude: 22.6517, longitude: 75.7876, domain: "iimidr.ac.in" },

  // Medical
  { name: "AIIMS New Delhi (New Delhi)", latitude: 28.5672, longitude: 77.2100, domain: "aiims.edu" },
  { name: "AIIMS Rishikesh (Rishikesh)", latitude: 30.0763, longitude: 78.2878, domain: "aiimsrishikesh.edu.in" },
  { name: "AIIMS Jodhpur (Jodhpur)", latitude: 26.2427, longitude: 73.0076, domain: "aiimsjodhpur.edu.in" },
  { name: "JIPMER (Puducherry)", latitude: 11.9546, longitude: 79.8115, domain: "jipmer.edu.in" },

  // Premier Universities
  { name: "Delhi University - North Campus", latitude: 28.6904, longitude: 77.2120, domain: "du.ac.in" },
  { name: "Delhi University - South Campus", latitude: 28.5847, longitude: 77.1641, domain: "south.du.ac.in" },
  { name: "JNU - Jawaharlal Nehru University (Delhi)", latitude: 28.5401, longitude: 77.1664, domain: "jnu.ac.in" },
  { name: "DTU - Delhi Technological University", latitude: 28.7501, longitude: 77.1177, domain: "dtu.ac.in" },
  { name: "NSUT - Netaji Subhas University of Technology", latitude: 28.6092, longitude: 77.0372, domain: "nsut.ac.in" },
  { name: "IIIT Hyderabad (Gachibowli)", latitude: 17.4451, longitude: 78.3489, domain: "iiit.ac.in" },
  { name: "IIIT Bangalore (Electronic City)", latitude: 12.8440, longitude: 77.6633, domain: "iiitb.ac.in" },
  { name: "IIIT Delhi (Okhla)", latitude: 28.5459, longitude: 77.2732, domain: "iiitd.ac.in" },
  { name: "VIT - Vellore Institute of Technology", latitude: 12.9692, longitude: 79.1559, domain: "vit.ac.in" },
  { name: "Manipal Institute of Technology (MAHE)", latitude: 13.3525, longitude: 74.7928, domain: "manipal.edu" },
  { name: "Anna University (Chennai)", latitude: 13.0109, longitude: 80.2354, domain: "annauniv.edu" },
  { name: "Jadavpur University (Kolkata)", latitude: 22.4988, longitude: 88.3715, domain: "jadavpuruniversity.in" },
  { name: "COEP Technological University (Pune)", latitude: 18.5298, longitude: 73.8565, domain: "coep.org.in" },
  { name: "Ashoka University (Sonipat)", latitude: 28.9482, longitude: 77.1009, domain: "ashoka.edu.in" },
  { name: "Thapar Institute of Engg (Patiala)", latitude: 30.3539, longitude: 76.3639, domain: "thapar.edu" },
  { name: "Christ University (Bengaluru)", latitude: 12.9344, longitude: 77.6060, domain: "christuniversity.in" },
  { name: "SRM University (Chennai)", latitude: 12.8230, longitude: 80.0450, domain: "srmist.edu.in" },
  { name: "Jamia Millia Islamia (New Delhi)", latitude: 28.5616, longitude: 77.2802, domain: "jmi.ac.in" },
  { name: "Panjab University (Chandigarh)", latitude: 30.7599, longitude: 76.7684, domain: "puchd.ac.in" },
];

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
