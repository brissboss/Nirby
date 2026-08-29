import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, PoiVisibility, CollaboratorRole } from "@prisma/client";
import { hashPassword } from "../src/auth/hash";
import { refreshPlaceCache } from "../src/google-place/service";

if (process.env.ALLOW_DEMO_SEED !== "yes") {
  console.error("Refusé. Lance avec ALLOW_DEMO_SEED=yes");
  process.exit(1);
}

const url = process.env.MIGRATE_DATABASE_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL manquante");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
const PASSWORD = process.env.DEMO_PASSWORD ?? "ExamNirby2026!";

async function main() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "ListCollaborator", "SavedPoi", "PoiList", "Poi",
      "GooglePlaceCache", "Session", "User"
    CASCADE
  `);

  const passwordHash = await hashPassword(PASSWORD);

  const theo = await prisma.user.create({
    data: {
      email: "theo@nirby.fr",
      name: "Théo Brissiaud",
      bio: "Créateur de Nirby. J’explore Paris à pied et je collectionne les bons spots",
      avatarUrl: "https://i.pravatar.cc/256?u=theo5@nirby.fr",
      passwordHash,
      emailVerified: true,
    },
  });
  const alice = await prisma.user.create({
    data: {
      email: "alice@nirby.fr",
      name: "Alice",
      passwordHash,
      avatarUrl: "https://i.pravatar.cc/256?u=alice@nirby.fr",
      emailVerified: true,
    },
  });
  const bob = await prisma.user.create({
    data: {
      email: "bob@nirby.fr",
      name: "Bob",
      passwordHash,
      avatarUrl: "https://i.pravatar.cc/256?u=bob@nirby.fr",
      emailVerified: true,
    },
  });

  // POI custom
  const foodTruck = await prisma.poi.create({
    data: {
      name: "Le Camion des Batelières",
      description: "Food truck à tester, smash burgers le midi, souvent stationné ici",
      address: "16 rue de la Grange Batelière, 75009 Paris",
      latitude: 48.87324,
      longitude: 2.34126,
      category: "restaurant",
      visibility: PoiVisibility.PRIVATE,
      createdBy: theo.id,
    },
  });

  const GOOGLE_PLACES = {
    joyo: "ChIJqfqhkMlv5kcRQdFf4p04FtA", // Jōyō - Azian Pub
    paradis: "ChIJxSgy8Exu5kcROjIgPvg3Sts", // Paradis du Fruit Batignolles
    junk: "ChIJdV43J6dt5kcRp_zyMipXw2o", // JUNK Saint-Maur
    pocha: "ChIJiZmsoc9v5kcRKVxI9X4G4mQ", // Pocha
    chartier: "ChIJ4xutfT5u5kcRaJn2NkiOhPU", // Bouillon Chartier
    pny: "ChIJLYfvzBNu5kcRW2ZfP1fdAcE", // PNY Faubourg Saint-Denis
    wonderland: "ChIJTweH9X9x5kcRGOH_w__UC0M", // Wonderland brunch
    yatai: "ChIJmbX6bzVv5kcR0JiiXCwYs0Q", // Yatai Ramen
    piccola: "ChIJfUmjF2hv5kcRCGxz7h-2-Yg", // Piccola Mia
    monbleu: "ChIJH1s6HD9u5kcRUIAFNWD-jQ4", // MONBLEU
    banquet: "ChIJX3SODgBv5kcRPUWtzrxQuwE", // ENVIE LE BANQUET
    keopi: "ChIJtY_y3uJv5kcRITnks0-GyFc", // Keopi
    moemachi: "ChIJqSiCV3Fv5kcRpyFPcpghiyY", // Moemachi
  } as const;

  type GooglePlaceKey = keyof typeof GOOGLE_PLACES;
  const googlePlaces = {} as Record<GooglePlaceKey, { placeId: string; name: string }>;

  console.log("📍 Fetching Google Places from API...");
  for (const [key, placeId] of Object.entries(GOOGLE_PLACES) as [GooglePlaceKey, string][]) {
    const place = await refreshPlaceCache(placeId, "fr");
    googlePlaces[key] = place;
    console.log(`   ✓ ${place.name}`);
  }

  async function saveGooglePlaces(listId: string, keys: GooglePlaceKey[]) {
    for (const key of keys) {
      await prisma.savedPoi.create({
        data: { listId, googlePlaceId: googlePlaces[key].placeId },
      });
    }
  }

  // A. Liste privée de Théo — 9e + Fraktion
  const privateList = await prisma.poiList.create({
    data: {
      name: "Mes spots secrets",
      description: "Liste privée de la démo",
      visibility: PoiVisibility.PRIVATE,
      createdBy: theo.id,
    },
  });
  await prisma.savedPoi.create({ data: { listId: privateList.id, poiId: foodTruck.id } });
  await saveGooglePlaces(privateList.id, ["chartier", "monbleu", "keopi", "yatai"]);

  // B. Liste partagée, Théo owner, Alice EDITOR
  const sharedList = await prisma.poiList.create({
    data: {
      name: "Paris entre potes",
      visibility: PoiVisibility.SHARED,
      createdBy: theo.id,
    },
  });
  await saveGooglePlaces(sharedList.id, ["joyo", "pocha", "pny", "piccola", "banquet"]);
  await prisma.listCollaborator.create({
    data: {
      listId: sharedList.id,
      userId: alice.id,
      role: CollaboratorRole.EDITOR,
      invitedBy: theo.id,
    },
  });

  // C. Liste d'Alice, Théo EDITOR
  const collabList = await prisma.poiList.create({
    data: { name: "Brunch d'Alice", visibility: PoiVisibility.SHARED, createdBy: alice.id },
  });
  await saveGooglePlaces(collabList.id, ["wonderland", "paradis"]);
  await prisma.listCollaborator.create({
    data: {
      listId: collabList.id,
      userId: theo.id,
      role: CollaboratorRole.EDITOR,
      invitedBy: alice.id,
    },
  });

  // D. Liste de Bob, Théo VIEWER
  const viewerList = await prisma.poiList.create({
    data: { name: "Road trip de Bob", visibility: PoiVisibility.SHARED, createdBy: bob.id },
  });
  await saveGooglePlaces(viewerList.id, ["junk", "moemachi"]);
  await prisma.listCollaborator.create({
    data: {
      listId: viewerList.id,
      userId: theo.id,
      role: CollaboratorRole.VIEWER,
      invitedBy: bob.id,
    },
  });

  console.log("Comptes : theo@nirby.fr / alice@nirby.fr / bob@nirby.fr");
  console.log("Mot de passe :", PASSWORD);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
