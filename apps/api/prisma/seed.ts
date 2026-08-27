/**
 * Demo seed for the oral: wipes app tables (not Prisma migrations) then recreates
 * Théo + collaborators, custom POIs, shared lists, editor/viewer/admin roles.
 *
 * Local (NODE_ENV=development):
 *   pnpm -C apps/api prisma:seed
 *
 * Production (do not use prisma migrate reset):
 *   CONFIRM_RESET=RESET /opt/nirby/scripts/db-reset-and-seed.sh prod
 *   # or from a laptop via SSH tunnel, see the script header / PR description
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { CollaboratorRole, PrismaClient, PoiVisibility } from "@prisma/client";
import bcrypt from "bcrypt";

import { assertResetAllowed } from "./seed-guard";

const DEMO_PASSWORD = "password123";
const FRONTEND_URL = process.env.FRONTEND_URL ?? "https://nirby.theobrissiaud.fr";

const SHARE_TOKEN_PUBLIC = "oral-public-paris";
const SHARE_TOKEN_RESTOS = "oral-shared-restos";
const EDIT_TOKEN_WEEKEND = "oral-edit-weekend";

const SEED_GOOGLE_PLACES: Array<{
  placeId: string;
  fallbackName: string;
  fallbackAddress: string;
  latitude: number;
  longitude: number;
  category: string;
}> = [
  {
    placeId: "ChIJxYJUC2lv5kcRlhdpWba_aGU",
    fallbackName: "Le Tout-Paris",
    fallbackAddress: "5 Avenue Gabriel, 75008 Paris, France",
    latitude: 48.8676,
    longitude: 2.3215,
    category: "restaurant",
  },
  {
    placeId: "ChIJf-oe7Wdu5kcRRto099RQ9Fc",
    fallbackName: "Sacrée Fleur",
    fallbackAddress: "34 Rue des Trois Frères, 75018 Paris, France",
    latitude: 48.8842,
    longitude: 2.3388,
    category: "restaurant",
  },
  {
    placeId: "ChIJ0Y7Uk_lv5kcRxQMuMKFtVmc",
    fallbackName: "Le Marais",
    fallbackAddress: "Le Marais, 75004 Paris, France",
    latitude: 48.857,
    longitude: 2.362,
    category: "restaurant",
  },
  {
    placeId: "ChIJLU7jZClu5kcR4PcOOO6p3I0",
    fallbackName: "Tour Eiffel",
    fallbackAddress: "Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France",
    latitude: 48.8584,
    longitude: 2.2945,
    category: "tourist_attraction",
  },
  {
    placeId: "ChIJD3uTd9hx5kcR1IQvGfr8dbk",
    fallbackName: "Musée du Louvre",
    fallbackAddress: "Rue de Rivoli, 75001 Paris, France",
    latitude: 48.8606,
    longitude: 2.3376,
    category: "museum",
  },
];

function databaseUrl(): string {
  const url = process.env.MIGRATE_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL or MIGRATE_DATABASE_URL is required");
  }
  return url;
}

async function resetDatabase(prisma: PrismaClient): Promise<void> {
  console.log("🧹 Wiping application tables (schema + migrations kept)...");
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "SavedPoi",
      "ListCollaborator",
      "Session",
      "Poi",
      "PoiList",
      "GooglePlaceCache",
      "User"
    RESTART IDENTITY CASCADE
  `);
}

async function upsertGooglePlace(prisma: PrismaClient, entry: (typeof SEED_GOOGLE_PLACES)[number]) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (apiKey && apiKey.startsWith("AIza")) {
    try {
      const response = await fetch(
        `https://places.googleapis.com/v1/places/${entry.placeId}?languageCode=fr`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask":
              "id,internationalPhoneNumber,formattedAddress,location,rating,googleMapsUri,websiteUri,regularOpeningHours,priceLevel,userRatingCount,displayName,primaryTypeDisplayName,primaryType,editorialSummary,photos",
          },
        }
      );

      if (response.ok) {
        const place = (await response.json()) as {
          id: string;
          displayName?: { text: string; languageCode: string };
          editorialSummary?: { text: string; languageCode: string };
          formattedAddress?: string;
          location?: { latitude: number; longitude: number };
          rating?: number;
          userRatingCount?: number;
          websiteUri?: string;
          internationalPhoneNumber?: string;
          primaryType?: string;
          primaryTypeDisplayName?: { text: string; languageCode: string };
          googleMapsUri?: string;
          photos?: Array<{ name: string }>;
        };

        const cached = await prisma.googlePlaceCache.upsert({
          where: { placeId: place.id },
          create: {
            placeId: place.id,
            name: place.displayName?.text ?? entry.fallbackName,
            nameLang: place.displayName?.languageCode ?? "fr",
            description: place.editorialSummary?.text ?? null,
            descriptionLang: place.editorialSummary?.languageCode ?? null,
            address: place.formattedAddress ?? entry.fallbackAddress,
            latitude: place.location?.latitude ?? entry.latitude,
            longitude: place.location?.longitude ?? entry.longitude,
            category: place.primaryType ?? entry.category,
            categoryDisplayName: place.primaryTypeDisplayName?.text ?? null,
            categoryDisplayNameLang: place.primaryTypeDisplayName?.languageCode ?? null,
            website: place.websiteUri ?? null,
            phone: place.internationalPhoneNumber ?? null,
            rating: place.rating ?? null,
            userRatingCount: place.userRatingCount ?? null,
            photoReferences: place.photos?.map((p) => p.name) ?? [],
            googleMapsUri: place.googleMapsUri ?? null,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
          update: {},
        });
        console.log(`   ✓ Google Place ${cached.name}`);
        return cached;
      }

      console.warn(
        `   ⚠️  Google Places HTTP ${response.status} for ${entry.fallbackName} — using fallback`
      );
    } catch (error) {
      console.warn(
        `   ⚠️  Google Places fetch failed for ${entry.fallbackName} — using fallback`,
        error
      );
    }
  } else {
    console.warn("⚠️  GOOGLE_PLACES_API_KEY not set — using static Google Place fallbacks");
  }

  const cached = await prisma.googlePlaceCache.upsert({
    where: { placeId: entry.placeId },
    create: {
      placeId: entry.placeId,
      name: entry.fallbackName,
      nameLang: "fr",
      address: entry.fallbackAddress,
      latitude: entry.latitude,
      longitude: entry.longitude,
      category: entry.category,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    update: {},
  });
  console.log(`   ✓ fallback ${cached.name}`);
  return cached;
}

async function main(): Promise<void> {
  assertResetAllowed();
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl() }) });

  try {
    await seedDemo(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

async function seedDemo(prisma: PrismaClient): Promise<void> {
  console.log("🌱 Seeding demo database for oral...");

  await resetDatabase(prisma);

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const theo = await prisma.user.create({
    data: {
      email: "theobrissiaud@icloud.com",
      passwordHash,
      name: "Théo",
      bio: "Compte de démo — oral Nirby",
      emailVerified: true,
    },
  });

  const alice = await prisma.user.create({
    data: {
      email: "alice@test.com",
      passwordHash,
      name: "Alice",
      bio: "Compte collaboratrice — édite les listes de Théo",
      emailVerified: true,
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: "bob@test.com",
      passwordHash,
      name: "Bob",
      bio: "Compte secondaire pour tester le rôle lecteur",
      emailVerified: true,
    },
  });

  const lea = await prisma.user.create({
    data: {
      email: "lea@test.com",
      passwordHash,
      name: "Léa",
      bio: "Partage ses musées en lecture seule",
      emailVerified: true,
    },
  });

  await prisma.user.create({
    data: {
      email: "marc@test.com",
      passwordHash,
      name: "Marc",
      bio: "Email non vérifié — le login doit être refusé",
      emailVerified: false,
    },
  });

  const googlePlaces = [];
  console.log("📍 Google Places...");
  for (const entry of SEED_GOOGLE_PLACES) {
    googlePlaces.push(await upsertGooglePlace(prisma, entry));
  }

  const [fraktion, flore, luxembourg, shakespeare, buttes, pain, perchoir, comptoir] =
    await prisma.poi.createManyAndReturn({
      data: [
        {
          name: "Fraktion",
          description: "Startup fintech — bureau de démo",
          latitude: 48.87324153744834,
          longitude: 2.3412600502008014,
          address: "16 rue de la Grange Batelière, 75009 Paris, France",
          category: "other",
          visibility: PoiVisibility.PRIVATE,
          createdBy: theo.id,
        },
        {
          name: "Café de Flore",
          description: "Terrasse historique Saint-Germain",
          latitude: 48.8541,
          longitude: 2.3326,
          address: "172 Boulevard Saint-Germain, 75006 Paris, France",
          category: "cafe",
          website: "https://cafedeflore.fr",
          visibility: PoiVisibility.SHARED,
          createdBy: theo.id,
        },
        {
          name: "Jardin du Luxembourg",
          description: "Chaises vertes, bassin, photos jury",
          latitude: 48.8462,
          longitude: 2.3372,
          address: "75006 Paris, France",
          category: "park",
          visibility: PoiVisibility.PUBLIC,
          createdBy: theo.id,
        },
        {
          name: "Shakespeare and Company",
          description: "Librairie anglophone face à Notre-Dame",
          latitude: 48.8526,
          longitude: 2.3472,
          address: "37 Rue de la Bûcherie, 75005 Paris, France",
          category: "other",
          visibility: PoiVisibility.SHARED,
          createdBy: theo.id,
        },
        {
          name: "Parc des Buttes-Chaumont",
          description: "Temple de la Sibylle, belvédère",
          latitude: 48.8768,
          longitude: 2.3812,
          address: "1 Rue Botzaris, 75019 Paris, France",
          category: "park",
          visibility: PoiVisibility.PRIVATE,
          createdBy: theo.id,
        },
        {
          name: "Du Pain et Des Idées",
          description: "Meilleure pistache du 10e",
          latitude: 48.8712,
          longitude: 2.3628,
          address: "34 Rue Yves Toudic, 75010 Paris, France",
          category: "bakery",
          visibility: PoiVisibility.SHARED,
          createdBy: theo.id,
        },
        {
          name: "Le Perchoir Marais",
          description: "Rooftop pour afterworks",
          latitude: 48.8631,
          longitude: 2.3569,
          address: "14 Rue Crespin du Gast, 75011 Paris, France",
          category: "bar",
          visibility: PoiVisibility.PRIVATE,
          createdBy: theo.id,
        },
        {
          name: "Le Comptoir du Relais",
          description: "Bistrot — réserver",
          latitude: 48.8534,
          longitude: 2.3393,
          address: "9 Carrefour de l'Odéon, 75006 Paris, France",
          category: "restaurant",
          visibility: PoiVisibility.SHARED,
          createdBy: theo.id,
        },
      ],
    });

  const [orsay, brunchSpot] = await prisma.poi.createManyAndReturn({
    data: [
      {
        name: "Musée d’Orsay — entrée visiteurs",
        description: "Rendez-vous Léa sous l’horloge",
        latitude: 48.86,
        longitude: 2.3266,
        address: "1 Rue de la Légion d'Honneur, 75007 Paris, France",
        category: "museum",
        visibility: PoiVisibility.SHARED,
        createdBy: lea.id,
      },
      {
        name: "Hardware Société",
        description: "Brunch / café — liste de Bob",
        latitude: 48.8867,
        longitude: 2.3431,
        address: "10 Rue Lamarck, 75018 Paris, France",
        category: "cafe",
        visibility: PoiVisibility.SHARED,
        createdBy: bob.id,
      },
    ],
  });

  const [aliceBelleville, aliceCanal] = await prisma.poi.createManyAndReturn({
    data: [
      {
        name: "Parc de Belleville",
        description: "Vue sur Paris — étape du road trip d’Alice",
        latitude: 48.8715,
        longitude: 2.3848,
        address: "47 Rue des Couronnes, 75020 Paris, France",
        category: "park",
        visibility: PoiVisibility.SHARED,
        createdBy: alice.id,
      },
      {
        name: "Point Éphémère",
        description: "Canal Saint-Martin",
        latitude: 48.8744,
        longitude: 2.3647,
        address: "200 Quai de Valmy, 75010 Paris, France",
        category: "bar",
        visibility: PoiVisibility.SHARED,
        createdBy: alice.id,
      },
    ],
  });

  const weekend = await prisma.poiList.create({
    data: {
      name: "Week-end à Paris",
      description:
        "Liste principale bien remplie — Théo propriétaire, Alice éditrice, Léa lectrice",
      visibility: PoiVisibility.PRIVATE,
      createdBy: theo.id,
      editToken: EDIT_TOKEN_WEEKEND,
    },
  });

  const restos = await prisma.poiList.create({
    data: {
      name: "Restos du centre",
      description: "Liste partagée (lien public + collaborateurs)",
      visibility: PoiVisibility.SHARED,
      shareToken: SHARE_TOKEN_RESTOS,
      createdBy: theo.id,
    },
  });

  const jury = await prisma.poiList.create({
    data: {
      name: "Spots à montrer au jury",
      description: "Liste publique avec lien /shared — ouvrir en navigation privée",
      visibility: PoiVisibility.PUBLIC,
      shareToken: SHARE_TOKEN_PUBLIC,
      createdBy: theo.id,
    },
  });

  const afterworks = await prisma.poiList.create({
    data: {
      name: "Afterworks",
      description: "Liste perso de Théo (privée, sans collab)",
      visibility: PoiVisibility.PRIVATE,
      createdBy: theo.id,
    },
  });

  const aliceRoadTrip = await prisma.poiList.create({
    data: {
      name: "Road trip d’Alice",
      description: "Théo est ÉDITEUR — il peut ajouter des lieux, pas supprimer la liste",
      visibility: PoiVisibility.SHARED,
      createdBy: alice.id,
    },
  });

  const leaMuseums = await prisma.poiList.create({
    data: {
      name: "Musées de Léa",
      description: "Théo est LECTEUR — UI en lecture seule",
      visibility: PoiVisibility.PRIVATE,
      createdBy: lea.id,
    },
  });

  const bobBrunch = await prisma.poiList.create({
    data: {
      name: "Brunch de Bob",
      description: "Théo est ADMIN — gestion collabs, pas propriétaire",
      visibility: PoiVisibility.SHARED,
      createdBy: bob.id,
    },
  });

  const savedPois: Array<{ listId: string; poiId?: string; googlePlaceId?: string }> = [
    { listId: weekend.id, poiId: fraktion.id },
    { listId: weekend.id, poiId: flore.id },
    { listId: weekend.id, poiId: luxembourg.id },
    { listId: weekend.id, poiId: shakespeare.id },
    { listId: weekend.id, poiId: buttes.id },
    { listId: weekend.id, poiId: pain.id },
    { listId: weekend.id, poiId: comptoir.id },
    ...googlePlaces.map((place) => ({ listId: weekend.id, googlePlaceId: place.placeId })),
    { listId: restos.id, poiId: comptoir.id },
    { listId: restos.id, poiId: pain.id },
    { listId: restos.id, poiId: flore.id },
    { listId: jury.id, poiId: luxembourg.id },
    { listId: jury.id, poiId: shakespeare.id },
    { listId: jury.id, poiId: fraktion.id },
    { listId: afterworks.id, poiId: perchoir.id },
    { listId: afterworks.id, poiId: flore.id },
    { listId: aliceRoadTrip.id, poiId: aliceBelleville.id },
    { listId: aliceRoadTrip.id, poiId: aliceCanal.id },
    { listId: aliceRoadTrip.id, poiId: buttes.id },
    { listId: leaMuseums.id, poiId: orsay.id },
    { listId: bobBrunch.id, poiId: brunchSpot.id },
    { listId: bobBrunch.id, poiId: pain.id },
  ];

  const restosGoogle = [googlePlaces[0], googlePlaces[1]];
  const juryGoogle = [googlePlaces[3], googlePlaces[4]];
  const leaGoogle = [googlePlaces[4]];
  for (const place of restosGoogle) {
    if (place) savedPois.push({ listId: restos.id, googlePlaceId: place.placeId });
  }
  for (const place of juryGoogle) {
    if (place) savedPois.push({ listId: jury.id, googlePlaceId: place.placeId });
  }
  for (const place of leaGoogle) {
    if (place) savedPois.push({ listId: leaMuseums.id, googlePlaceId: place.placeId });
  }

  await prisma.savedPoi.createMany({ data: savedPois });

  await prisma.listCollaborator.createMany({
    data: [
      {
        listId: weekend.id,
        userId: alice.id,
        role: CollaboratorRole.EDITOR,
        invitedBy: theo.id,
      },
      {
        listId: weekend.id,
        userId: lea.id,
        role: CollaboratorRole.VIEWER,
        invitedBy: theo.id,
      },
      {
        listId: restos.id,
        userId: alice.id,
        role: CollaboratorRole.EDITOR,
        invitedBy: theo.id,
      },
      {
        listId: restos.id,
        userId: bob.id,
        role: CollaboratorRole.VIEWER,
        invitedBy: theo.id,
      },
      {
        listId: aliceRoadTrip.id,
        userId: theo.id,
        role: CollaboratorRole.EDITOR,
        invitedBy: alice.id,
      },
      {
        listId: aliceRoadTrip.id,
        userId: bob.id,
        role: CollaboratorRole.VIEWER,
        invitedBy: alice.id,
      },
      {
        listId: leaMuseums.id,
        userId: theo.id,
        role: CollaboratorRole.VIEWER,
        invitedBy: lea.id,
      },
      {
        listId: bobBrunch.id,
        userId: theo.id,
        role: CollaboratorRole.ADMIN,
        invitedBy: bob.id,
      },
      {
        listId: bobBrunch.id,
        userId: alice.id,
        role: CollaboratorRole.VIEWER,
        invitedBy: bob.id,
      },
    ],
  });

  console.log("");
  console.log("✅ Seed oral terminé");
  console.log("");
  console.log("Comptes (mot de passe pour tous : password123)");
  console.log("  Théo  theobrissiaud@icloud.com  ← compte principal, email vérifié");
  console.log("  Alice alice@test.com");
  console.log("  Bob   bob@test.com");
  console.log("  Léa   lea@test.com");
  console.log("  Marc  marc@test.com             ← email NON vérifié (login refusé)");
  console.log("");
  console.log("Connecté en Théo, tu dois voir :");
  console.log("  OWNER  — Week-end à Paris, Restos du centre, Spots à montrer au jury, Afterworks");
  console.log("  EDITOR — Road trip d’Alice");
  console.log("  VIEWER — Musées de Léa");
  console.log("  ADMIN  — Brunch de Bob");
  console.log("");
  console.log("Liens publics (navigation privée) :");
  console.log(`  ${FRONTEND_URL}/shared/${SHARE_TOKEN_PUBLIC}`);
  console.log(`  ${FRONTEND_URL}/shared/${SHARE_TOKEN_RESTOS}`);
  console.log("");
  console.log("Lien d’édition (rejoindre Week-end à Paris) :");
  console.log(`  ${FRONTEND_URL}/list/${weekend.id}/join?editToken=${EDIT_TOKEN_WEEKEND}`);
}

main().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
