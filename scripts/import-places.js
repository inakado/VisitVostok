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
    
    // Проверяем, сколько уникальных мест уже есть в базе
    const existingPlaces = await prisma.place.findMany({
      select: {
        lat: true,
        lng: true,
        title: true
      }
    });
    
    const existingCoords = new Set(
      existingPlaces.map(p => `${p.lat},${p.lng}`)
    );
    
    console.log(`📍 В базе уже есть ${existingPlaces.length} мест`);
    
    // Фильтруем только новые места
    const newPlaces = places.filter(place => {
      const coordKey = `${place.location.lat},${place.location.lng}`;
      return !existingCoords.has(coordKey);
    });
    
    console.log(`✨ К импорту ${newPlaces.length} новых мест`);
    
    if (newPlaces.length === 0) {
      console.log('✅ Все места уже импортированы!');
      return;
    }
    
    // Импортируем только новые места батчами по 100
    const batchSize = 100;
    let imported = 0;
    
    for (let i = 0; i < newPlaces.length; i += batchSize) {
      const batch = newPlaces.slice(i, i + batchSize);
      
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
      });
      
      imported += batch.length;
      console.log(`✅ Импортировано ${imported}/${newPlaces.length} новых мест`);
    }
    
    console.log('🎉 Импорт завершён успешно!');
    
    // Показываем статистику
    const totalPlaces = await prisma.place.count();
    
    const uniqueByCoords = await prisma.place.groupBy({
      by: ['lat', 'lng'],
      _count: { id: true }
    });
    
    console.log(`\n📈 Статистика:`);
    console.log(`Всего записей в базе: ${totalPlaces}`);
    console.log(`Уникальных мест: ${uniqueByCoords.length}`);
    
    if (totalPlaces > uniqueByCoords.length) {
      console.log(`🚨 Обнаружены дубликаты! Рекомендуется запустить: npm run clean-duplicates`);
    }
    
  } catch (error) {
    console.error('❌ Ошибка при импорте:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем импорт
importPlaces(); 