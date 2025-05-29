import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const prisma = new PrismaClient().$extends(withAccelerate());

async function checkDuplicates() {
  try {
    console.log('🔍 Проверяю дубликаты в базе данных...');
    
    // Общее количество мест
    const totalPlaces = await prisma.place.count();
    console.log(`📊 Всего мест в БД: ${totalPlaces}`);
    
    // Проверяем дубликаты по координатам
    const duplicatesByCoords = await prisma.place.groupBy({
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
    
    console.log(`🚨 Найдено групп дубликатов по координатам: ${duplicatesByCoords.length}`);
    
    // Показываем несколько примеров дубликатов
    for (let i = 0; i < Math.min(5, duplicatesByCoords.length); i++) {
      const group = duplicatesByCoords[i];
      console.log(`   Координаты [${group.lat}, ${group.lng}]: ${group._count.id} дубликатов`);
      
      const places = await prisma.place.findMany({
        where: {
          lat: group.lat,
          lng: group.lng
        },
        select: {
          id: true,
          title: true,
          createdAt: true
        }
      });
      
      places.forEach(place => {
        console.log(`     - ${place.title} (${place.id}) - ${place.createdAt}`);
      });
    }
    
    // Проверяем дубликаты по названию и адресу
    const duplicatesByTitle = await prisma.place.groupBy({
      by: ['title', 'address'],
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
    
    console.log(`🚨 Найдено групп дубликатов по названию+адресу: ${duplicatesByTitle.length}`);
    
    // Уникальные места (должно быть ~381)
    const uniqueByCoords = await prisma.place.groupBy({
      by: ['lat', 'lng'],
      _count: {
        id: true
      }
    });
    
    console.log(`✅ Уникальных мест по координатам: ${uniqueByCoords.length}`);
    
  } catch (error) {
    console.error('❌ Ошибка при проверке дубликатов:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDuplicates(); 