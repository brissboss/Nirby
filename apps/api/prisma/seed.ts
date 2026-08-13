import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, PoiVisibility, CollaboratorRole, GooglePlaceCache } from "@prisma/client";
import { hashPassword } from "../src/auth/hash";
import { env } from "../src/env";
import { refreshPlaceCache } from "../src/google-place/service";

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SEED_GOOGLE_PLACE_IDS = [
  "ChIJxYJUC2lv5kcRlhdpWba_aGU", // Le Tout-Paris
  "ChIJf-oe7Wdu5kcRRto099RQ9Fc", // Sacrée Fleur Montmartre
  "ChIJ0Y7Uk_lv5kcRxQMuMKFtVmc", // Le Marais Restaurant Paris
] as const;

async function seedGooglePlaces() {
  if (!env.GOOGLE_PLACES_API_KEY) {
    console.warn("⚠️  GOOGLE_PLACES_API_KEY not set — skipping Google Places seed");
    return [];
  }

  console.log("📍 Fetching Google Places from API...");
  const places: GooglePlaceCache[] = [];

  for (const placeId of SEED_GOOGLE_PLACE_IDS) {
    const place = await refreshPlaceCache(placeId, "fr");
    places.push(place);
    console.log(`   ✓ ${place.name}`);
  }

  return places;
}

async function main() {
  console.log("🌱 Seeding database...");

  const user1 = await prisma.user.create({
    data: {
      email: "theobrissiaud@icloud.com",
      passwordHash: await hashPassword("password123"),
      name: "Théo",
      emailVerified: true,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: "alice@test.com",
      passwordHash: await hashPassword("password123"),
      name: "Alice",
      emailVerified: true,
    },
  });

  await prisma.user.create({
    data: {
      email: "bob@test.com",
      passwordHash: await hashPassword("password123"),
      name: "Bob",
      emailVerified: false,
    },
  });

  const poi1 = await prisma.poi.create({
    data: {
      name: "Fraktion",
      description: "Startup - Fintech - Paris",
      latitude: 48.87324153744834,
      longitude: 2.3412600502008014,
      address: "16 rue de la Grange Batelière, 75009, Paris, France",
      category: "landmark",
      visibility: PoiVisibility.PRIVATE,
      createdBy: user1.id,
    },
  });

  const googlePlaces = await seedGooglePlaces();

  const list1 = await prisma.poiList.create({
    data: {
      name: "Mes lieux favoris à Paris",
      description: "Les endroits que j'adore",
      visibility: PoiVisibility.PRIVATE,
      createdBy: user1.id,
    },
  });

  const list2 = await prisma.poiList.create({
    data: {
      name: "Liste partagée",
      visibility: PoiVisibility.PUBLIC,
      shareToken: "demo-share-token",
      createdBy: user1.id,
    },
  });

  await prisma.savedPoi.create({
    data: {
      listId: list1.id,
      poiId: poi1.id,
    },
  });

  for (const googlePlace of googlePlaces) {
    await prisma.savedPoi.create({
      data: {
        listId: list1.id,
        googlePlaceId: googlePlace.placeId,
      },
    });
  }

  await prisma.savedPoi.create({
    data: {
      listId: list2.id,
      poiId: poi1.id,
    },
  });

  if (googlePlaces[0]) {
    await prisma.savedPoi.create({
      data: {
        listId: list2.id,
        googlePlaceId: googlePlaces[0].placeId,
      },
    });
  }

  await prisma.listCollaborator.create({
    data: {
      listId: list1.id,
      userId: user2.id,
      role: CollaboratorRole.EDITOR,
      invitedBy: user1.id,
    },
  });

  console.log("✅ Seed completed!");
  console.log(`   - 3 users created`);
  console.log(`   - 1 custom POI created`);
  console.log(`   - ${googlePlaces.length} Google Places cached`);
  console.log(`   - 2 lists created`);
  console.log(`   - 1 collaborator added`);
  console.log("");
  console.log("📧 Test accounts:");
  console.log("   theobrissiaud@icloud.com / password123");
  console.log("   alice@test.com / password123");
  console.log("   bob@test.com / password123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
