import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma"; // путь к твоему Prisma клиенту
import { cookies } from "next/headers";

interface TelegramAuthData {
  [key: string]: string;
  hash: string;
}

function checkTelegramAuth(data: TelegramAuthData, botToken: string) {
  const { hash, ...fields } = data;
  const sorted = Object.keys(fields)
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join("\n");

  const secret = crypto.createHash("sha256").update(botToken).digest();
  const hmac = crypto.createHmac("sha256", secret).update(sorted).digest("hex");

  return hmac === hash;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries()) as TelegramAuthData;
  const isValid = checkTelegramAuth(params, process.env.TELEGRAM_BOT_SECRET!);

  if (!isValid) {
    return NextResponse.json({ error: "Invalid auth" }, { status: 403 });
  }

  const telegramId = params.id;
  const name = params.first_name;
  const avatar = params.photo_url;

  const user = await prisma.user.upsert({
    where: { telegramId },
    update: { name, avatarUrl: avatar },
    create: {
      telegramId,
      name,
      avatarUrl: avatar,
      role: "traveler",
    },
  });

  const cookieJar = await cookies();
  cookieJar.set("token", user.id, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });

  return NextResponse.redirect("/");
}