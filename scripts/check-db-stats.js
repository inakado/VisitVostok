import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const prisma = new PrismaClient().$extends(withAccelerate());

async function checkDbStats() {
  try {
    // Общее количество записей
    const totalPlaces = await prisma.place.count();
    
    // Уникальные места по координатам
    const uniqueByCoords = await prisma.place.groupBy({
      by: ['lat', 'lng'],
      _count: { id: true }
    });
    
    const uniquePlaces = uniqueByCoords.length;
    
    // Выводим результат в формате для bash
    console.log(`TOTAL_PLACES=${totalPlaces}`);
    console.log(`UNIQUE_PLACES=${uniquePlaces}`);
    console.log(`HAS_DUPLICATES=${totalPlaces > uniquePlaces ? 'true' : 'false'}`);
    
    // Дополнительная информация для отладки
    if (process.env.DEBUG === 'true') {
      console.log(`DEBUG: Total records: ${totalPlaces}`);
      console.log(`DEBUG: Unique locations: ${uniquePlaces}`);
      console.log(`DEBUG: Duplicates detected: ${totalPlaces > uniquePlaces}`);
    }
    
  } catch (error) {
    console.error('ERROR: Failed to check database stats:', error);
    // Fallback значения в случае ошибки
    console.log('TOTAL_PLACES=0');
    console.log('UNIQUE_PLACES=0');
    console.log('HAS_DUPLICATES=false');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkDbStats(); 