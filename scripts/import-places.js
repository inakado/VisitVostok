import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient().$extends(withAccelerate());

async function importPlaces() {
  try {
    console.log('🚀 Начинаю импорт мест из Приморского края...');
    
    // Читаем JSON файл
    const jsonPath = path.join(process.cwd(), 'public', 'primorsky_krai.json');
    const jsonData = fs.readFileSync(jsonPath, 'utf-8');
    const places = JSON.parse(jsonData);
    
    console.log(`📊 Найдено ${places.length} мест для импорта`);
    
    // Импортируем места батчами по 100
    const batchSize = 100;
    let imported = 0;
    
    for (let i = 0; i < places.length; i += batchSize) {
      const batch = places.slice(i, i + batchSize);
      
      const placesToCreate = batch.map(place => ({
        title: place.title,
        city: place.city,
        totalScore: place.totalScore,
        lat: place.location.lat,
        lng: place.location.lng,
        categoryName: place.categoryName || 'Достопримечательность',
        street: place.street,
        state: place.state || 'Приморский край',
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
      console.log(`✅ Импортировано ${imported}/${places.length} мест`);
    }
    
    console.log('🎉 Импорт завершён успешно!');
    
    // Показываем статистику
    const totalPlaces = await prisma.place.count();
    
    console.log(`\n📈 Статистика:`);
    console.log(`Всего мест в базе: ${totalPlaces}`);
    
  } catch (error) {
    console.error('❌ Ошибка при импорте:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем импорт
importPlaces(); 