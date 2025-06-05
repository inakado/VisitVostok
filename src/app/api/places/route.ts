import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    console.log("Fetching places from database...");
    const places = await prisma.place.findMany({
      orderBy: { createdAt: "desc" },
    });
    console.log(`Found ${places.length} places`);
    return NextResponse.json(places);
  } catch (error) {
    console.error("Error fetching places:", error);
    console.log("Returning empty array due to database error");
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Creating place:", body);
    
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

    console.log("Created place:", place.id);
    return NextResponse.json(place);
  } catch (error) {
    console.error("Error creating place:", error);
    return NextResponse.json(
      { error: "Failed to create place" },
      { status: 500 }
    );
  }
}
