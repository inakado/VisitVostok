import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const difficulty = searchParams.get('difficulty');
    const city = searchParams.get('city');
    const limit = parseInt(searchParams.get('limit') || '20');
    const featured = searchParams.get('featured') === 'true';

    const whereCondition: {
      difficulty?: string;
      city?: string;
    } = {};

    if (difficulty) {
      whereCondition.difficulty = difficulty;
    }

    if (city) {
      whereCondition.city = city;
    }

    // Если запрашиваем featured активности, берем по продолжительности
    const orderBy = featured 
      ? { duration: 'asc' as const } // Сначала короткие активности
      : { createdAt: 'desc' as const };

    const activities = await prisma.activity.findMany({
      where: whereCondition,
      orderBy,
      take: limit
    });

    // Трансформируем данные для фронтенда
    const transformedActivities = activities.map(activity => ({
      id: activity.id,
      title: activity.title,
      description: activity.description,
      imageUrl: '/activities/default-activity.webp',
      excerpt: activity.description,
      category: activity.difficulty,
      location: activity.city,
      duration: activity.duration,
      difficulty: activity.difficulty,
      tags: activity.tags,
      coordinates: { lat: 43.1056, lng: 131.8735 } // Дефолтные координаты Владивостока
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