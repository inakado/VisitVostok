import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Простая проверка авторизации
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (username === "admin" && password === adminPassword) {
      const response = NextResponse.json({ success: true });
      
      // Устанавливаем cookie для авторизации
      response.cookies.set("admin-auth", password, {
        httpOnly: true,
        secure: false, // Для HTTP
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24 часа
        path: "/"
      });

      // Дублируем установку cookie через cookies API
      const cookieStore = await cookies();
      cookieStore.set("admin-auth", password, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
        path: "/"
      });

      return response;
    } else {
      return NextResponse.json(
        { success: false, error: "Неверные учетные данные" },
        { status: 401 }
      );
    }
  } catch {
    return NextResponse.json(
      { success: false, error: "Ошибка сервера" },
      { status: 500 }
    );
  }
} 