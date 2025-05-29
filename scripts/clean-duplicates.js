import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const prisma = new PrismaClient().$extends(withAccelerate());

async function cleanDuplicates() {
  try {
    console.log('🧹 Начинаю очистку дубликатов...');
    
    // Получаем все места, группированные по координатам
    const duplicateGroups = await prisma.place.groupBy({
      by: ['lat', 'lng'],
      _count: {
        id: true
      },
      having: {
        id: {
          _count: {
            gt: 1
          }
        }
      }
    });
    
    console.log(`🔍 Найдено ${duplicateGroups.length} групп дубликатов`);
    
    let totalDeleted = 0;
    
    for (const group of duplicateGroups) {
      // Получаем все места с этими координатами
      const places = await prisma.place.findMany({
        where: {
          lat: group.lat,
          lng: group.lng
        },
        orderBy: {
          createdAt: 'asc' // Сортируем по дате создания, оставляем самое старое
        }
      });
      
      if (places.length > 1) {
        // Оставляем первое (самое старое), удаляем остальные
        const toDelete = places.slice(1);
        const placesToDeleteIds = toDelete.map(p => p.id);
        
        console.log(`📍 [${group.lat}, ${group.lng}] "${places[0].title}": удаляю ${toDelete.length} дубликатов`);
        
        // Удаляем дубликаты
        await prisma.place.deleteMany({
          where: {
            id: {
              in: placesToDeleteIds
            }
          }
        });
        
        totalDeleted += toDelete.length;
      }
    }
    
    console.log(`✅ Удалено ${totalDeleted} дубликатов`);
    
    // Финальная статистика
    const finalCount = await prisma.place.count();
    const uniqueByCoords = await prisma.place.groupBy({
      by: ['lat', 'lng'],
      _count: { id: true }
    });
    
    console.log(`\n📊 Финальная статистика:`);
    console.log(`Всего записей в базе: ${finalCount}`);
    console.log(`Уникальных мест: ${uniqueByCoords.length}`);
    
    if (finalCount === uniqueByCoords.length) {
      console.log('🎉 Дубликаты успешно удалены!');
    } else {
      console.log('⚠️  Возможно, остались дубликаты другого типа');
    }
    
  } catch (error) {
    console.error('❌ Ошибка при очистке дубликатов:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDuplicates(); 