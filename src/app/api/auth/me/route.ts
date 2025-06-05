import { NextResponse } from "next/server";

export async function GET() {
  // DEV-заглушка: всегда возвращаем тестового пользователя
  return NextResponse.json({
    user: {
      id: 'dev-user',
      name: 'Dev User',
      telegramId: null,
      avatarUrl: null,
      role: 'traveler',
      createdAt: new Date().toISOString(),
    }
  })
} 