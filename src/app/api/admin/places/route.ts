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

// GET - получение всех мест с расширенной пагинацией и фильтрацией
export async function GET(request: Request) {
  if (!await checkAdminAuth()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const subcategory = searchParams.get('subcategory') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Условия поиска
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { categoryName: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (category) {
      // Точное совпадение или содержит подстроку
      if (category.includes('*')) {
        where.categoryName = { contains: category.replace('*', ''), mode: 'insensitive' };
      } else {
        where.categoryName = category;
      }
    }
    
    if (subcategory) {
      where.categories = { has: subcategory };
    }

    // Сортировка
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [places, total] = await Promise.all([
      prisma.place.findMany({
        where,
        skip,
        take: limit,
        orderBy
      }),
      prisma.place.count({ where })
    ]);

    // Получаем уникальные категории и подкатегории для фильтров
    const [allCategories, allSubcategories] = await Promise.all([
      prisma.place.groupBy({
        by: ['categoryName'],
        _count: {
          categoryName: true
        },
        orderBy: {
          _count: {
            categoryName: 'desc'
          }
        }
      }),
      prisma.place.findMany({
        select: {
          categories: true
        },
        where: {
          categories: {
            isEmpty: false
          }
        }
      })
    ]);

    // Обработка подкатегорий
    const subcategoriesSet = new Set<string>();
    allSubcategories.forEach((place) => {
      if (Array.isArray(place.categories)) {
        place.categories.forEach((cat: string) => subcategoriesSet.add(cat));
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const categoriesForFilter = allCategories.map((cat: any) => ({
      name: cat.categoryName,
      count: cat._count.categoryName
    }));

    const subcategoriesForFilter = Array.from(subcategoriesSet).sort();

    return NextResponse.json({
      places,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      filters: {
        categories: categoriesForFilter,
        subcategories: subcategoriesForFilter
      }
    });
  } catch (error) {
    console.error('Ошибка получения мест:', error);
    return NextResponse.json({ error: "Failed to fetch places" }, { status: 500 });
  }
}

// POST - создание нового места
export async function POST(request: Request) {
  if (!await checkAdminAuth()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();
    
    const place = await prisma.place.create({
      data: {
        title: data.title,
        city: data.city,
        lat: parseFloat(data.lat),
        lng: parseFloat(data.lng),
        categoryName: data.categoryName,
        street: data.street,
        state: data.state || "Приморский край",
        address: data.address,
        categories: data.categories || [],
        temporarilyClosed: data.temporarilyClosed || false,
        description: data.description,
        imageUrl: data.imageUrl,
        price: data.price
      }
    });

    return NextResponse.json(place);
  } catch (error) {
    console.error('Ошибка создания места:', error);
    return NextResponse.json({ error: "Failed to create place" }, { status: 500 });
  }
} 