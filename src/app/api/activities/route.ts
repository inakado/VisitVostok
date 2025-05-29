import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Категории, которые считаем активностями
const ACTIVITY_CATEGORIES = [
  "Парк",
  "Природный заповедник",
  "Пляж",
  "Гора",
  "Водопад",
  "Музей",
  "Исторический памятник",
  "Смотровая площадка",
  "Туристическая достопримечательность",
  "Театр",
  "Зоопарк",
  "Сад",
  "Спортивный комплекс"
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');
    const featured = searchParams.get('featured') === 'true';

    let whereCondition: {
      categoryName: { in: string[] } | string;
      AND?: Array<{ imageUrl: { not: null } } | { totalScore: { gte: number } }>;
    } = {
      categoryName: {
        in: ACTIVITY_CATEGORIES
      }
    };

    if (category) {
      whereCondition.categoryName = category;
    }

    // Если запрашиваем featured активности, берем те, у которых есть изображения и высокие оценки
    if (featured) {
      whereCondition = {
        ...whereCondition,
        AND: [
          { imageUrl: { not: null } },
          { totalScore: { gte: 4.0 } }
        ]
      };
    }

    const activities = await prisma.place.findMany({
      where: whereCondition,
      orderBy: featured 
        ? [{ totalScore: 'desc' }, { reviewsCount: 'desc' }]
        : { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        categoryName: true,
        imageUrl: true,
        totalScore: true,
        reviewsCount: true,
        city: true,
        address: true,
        lat: true,
        lng: true,
        price: true
      }
    });

    // Трансформируем данные для фронтенда
    const transformedActivities = activities.map(place => ({
      id: place.id,
      title: place.title,
      imageUrl: place.imageUrl || '/activities/default-activity.webp',
      excerpt: generateExcerpt(place),
      category: place.categoryName,
      location: place.city || 'Приморский край',
      rating: place.totalScore,
      reviewsCount: place.reviewsCount || 0,
      coordinates: { lat: place.lat, lng: place.lng },
      price: place.price
    }));

    return NextResponse.json(transformedActivities);
  } catch (error) {
    console.error('Ошибка при получении активностей:', error);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}

// Функция для генерации описания активности на основе данных места
function generateExcerpt(place: {
  categoryName: string;
  city: string | null;
}): string {
  const descriptions: Record<string, string> = {
    "Парк": "Прекрасное место для прогулок и отдыха на природе",
    "Природный заповедник": "Уникальная экосистема и удивительная природа",
    "Пляж": "Морской отдых и водные развлечения",
    "Гора": "Потрясающие виды и пешие маршруты",
    "Водопад": "Живописный природный объект для посещения",
    "Музей": "Познавательная экскурсия и культурное обогащение",
    "Исторический памятник": "Погружение в историю региона",
    "Смотровая площадка": "Панорамные виды на окрестности",
    "Туристическая достопримечательность": "Популярное место среди путешественников",
    "Театр": "Культурное мероприятие и театральное искусство",
    "Зоопарк": "Знакомство с животным миром",
    "Сад": "Ботаническое разнообразие и красота природы",
    "Спортивный комплекс": "Активный отдых и спортивные мероприятия"
  };

  const baseDescription = descriptions[place.categoryName] || "Интересное место для посещения";
  
  if (place.city) {
    return `${baseDescription} в ${place.city}`;
  }
  
  return baseDescription;
} 