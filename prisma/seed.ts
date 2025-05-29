// prisma/seed.ts
import { prisma } from "../src/lib/prisma";
import fs from "fs/promises";
import path from "path";

interface PlaceData {
  title: string;
  city: string | null;
  totalScore: number | null;
  location: {
    lat: number;
    lng: number;
  };
  categoryName: string;
  street: string | null;
  state: string;
  reviewsCount: number | null;
  imageUrl: string | null;
  price: string | null;
  address: string;
  categories: string[];
  temporarilyClosed: boolean;
}

async function main() {
  console.log("🚀 Начинаю seed импорт мест из Приморского края...");
  
  const filePath = path.join(process.cwd(), "public", "primorsky_krai.json");
  const json = await fs.readFile(filePath, "utf8");
  const data: PlaceData[] = JSON.parse(json);

  console.log(`📊 Найдено ${data.length} мест для импорта`);

  // Импортируем места батчами по 50 для seed
  const batchSize = 50;
  let imported = 0;

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    
    const placesToCreate = batch.map(place => ({
      title: place.title,
      city: place.city,
      totalScore: place.totalScore,
      lat: place.location.lat,
      lng: place.location.lng,
      categoryName: place.categoryName || "Достопримечательность",
      street: place.street,
      state: place.state || "Приморский край",
      reviewsCount: place.reviewsCount,
      imageUrl: place.imageUrl,
      price: place.price,
      address: place.address,
      categories: place.categories || [],
      temporarilyClosed: place.temporarilyClosed || false,
    }));

    await prisma.place.createMany({
      data: placesToCreate,
      skipDuplicates: true,
    });

    imported += batch.length;
    console.log(`✅ Импортировано ${imported}/${data.length} мест`);
  }

  console.log("🎉 Seed импорт завершён успешно!");
  
  const totalPlaces = await prisma.place.count();
  console.log(`📈 Всего мест в базе: ${totalPlaces}`);
}

main()
  .catch((e) => {
    console.error("❌ Ошибка при seed импорте:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });