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

// PUT - обновление места
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await checkAdminAuth()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { id } = await params;

    const place = await prisma.place.update({
      where: { id },
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
    console.error('Ошибка обновления места:', error);
    return NextResponse.json({ error: "Failed to update place" }, { status: 500 });
  }
}

// DELETE - удаление места
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await checkAdminAuth()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    await prisma.place.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка удаления места:', error);
    return NextResponse.json({ error: "Failed to delete place" }, { status: 500 });
  }
} 