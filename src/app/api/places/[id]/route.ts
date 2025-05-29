// src/app/api/places/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const place = await prisma.place.findUnique({
      where: { id },
      include: {
        reviews: true
      },
    });

    if (!place) {
      return NextResponse.json({ error: "Место не найдено" }, { status: 404 });
    }

    return NextResponse.json(place);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch place" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const place = await prisma.place.update({
      where: { id },
      data: {
        title: body.title,
        lat: body.lat,
        lng: body.lng,
        categoryName: body.categoryName,
        city: body.city,
        state: body.state,
        address: body.address,
        categories: body.categories || [body.categoryName],
        totalScore: body.totalScore || null,
        reviewsCount: body.reviewsCount || 0,
        street: body.street || null,
      },
    });

    return NextResponse.json(place);
  } catch {
    return NextResponse.json(
      { error: "Failed to update place" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await prisma.place.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete place" },
      { status: 500 }
    );
  }
}