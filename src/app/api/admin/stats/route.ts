import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// Проверка админской авторизации
async function checkAdminAuth() {
  const cookieJar = await cookies();
  const adminAuth = cookieJar.get("admin-auth");
  const envPassword = process.env.ADMIN_PASSWORD;
  
  return adminAuth && adminAuth.value === envPassword;
}

// GET - получение статистики для дашборда
export async function GET() {
  if (!await checkAdminAuth()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Получаем статистику параллельно
    const [
      totalPlaces,
      categoriesCount,
      placesWithReviews,
      recentPlaces
    ] = await Promise.all([
      // Общее количество мест
      prisma.place.count(),
      
      // Количество уникальных категорий
      prisma.place.groupBy({
        by: ['categoryName'],
        _count: {
          categoryName: true
        }
      }),
      
      // Места с отзывами (места где есть totalScore)
      prisma.place.count({
        where: {
          totalScore: {
            not: null
          }
        }
      }),
      
      // Недавно добавленные места (за последние 7 дней)
      prisma.place.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    // Топ категории по количеству мест
    const topCategories = categoriesCount
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort((a: any, b: any) => (b._count?.categoryName || 0) - (a._count?.categoryName || 0))
      .slice(0, 5)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((cat: any) => ({
        name: cat.categoryName,
        count: cat._count?.categoryName || 0
      }));

    return NextResponse.json({
      totalPlaces,
      totalCategories: categoriesCount.length,
      placesWithReviews,
      recentPlaces,
      topCategories
    });
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
} 