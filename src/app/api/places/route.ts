import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const places = await prisma.place.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(places);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch places" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const place = await prisma.place.create({
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
        temporarilyClosed: false,
        price: body.price || null,
        street: body.street || null,
      },
    });

    return NextResponse.json(place);
  } catch {
    return NextResponse.json(
      { error: "Failed to create place" },
      { status: 500 }
    );
  }
}
