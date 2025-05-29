import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyTelegramPayload } from "@/lib/telegram-auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const payload = Object.fromEntries(searchParams.entries());

    const isValid = verifyTelegramPayload(payload);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const telegramId = payload.id;
    const name = [payload.first_name, payload.last_name].filter(Boolean).join(" ");
    const avatar = payload.photo_url;
    const username = payload.username; // ❗️если это поле есть в модели

    const user = await prisma.user.upsert({
      where: { telegramId },
      update: { name, avatarUrl: avatar, username },
      create: {
        telegramId,
        name,
        avatarUrl: avatar,
        username,
        role: "traveler",
      },
    });

    const cookieJar = await cookies();
    cookieJar.set("token", user.id.toString(), {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return NextResponse.redirect(new URL("/", req.url));
  } catch (error) {
    console.error("❌ Ошибка в /api/auth/telegram:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}