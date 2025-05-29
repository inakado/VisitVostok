import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const cookieJar = await cookies();
  const token = cookieJar.get("token")?.value;
  const { role } = await req.json();

  if (!token || !["traveler", "local"].includes(role)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: token },
    data: { role },
  });

  return NextResponse.json({ success: true, role: user.role });
}