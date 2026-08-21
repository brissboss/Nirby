import { createE2ePrisma } from "./prisma";

export async function seedListWithCustomPoi(args: {
  userId: string;
  listName: string;
  poiName: string;
}): Promise<{ listId: string; poiId: string }> {
  const prisma = createE2ePrisma();

  try {
    const list = await prisma.poiList.create({
      data: {
        name: args.listName,
        description: "Liste seedée pour e2e",
        createdBy: args.userId,
        visibility: "PRIVATE",
      },
    });

    const poi = await prisma.poi.create({
      data: {
        name: args.poiName,
        description: "POI custom seedé, sans Mapbox",
        address: "16 rue de la Grange Batelière, Paris",
        latitude: 48.87324,
        longitude: 2.34126,
        category: "landmark",
        visibility: "PRIVATE",
        createdBy: args.userId,
      },
    });

    await prisma.savedPoi.create({
      data: { listId: list.id, poiId: poi.id },
    });

    return { listId: list.id, poiId: poi.id };
  } finally {
    await prisma.$disconnect();
  }
}
