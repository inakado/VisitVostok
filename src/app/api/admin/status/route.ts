import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const adminAuth = cookieStore.get("admin-auth");
    const envPassword = process.env.ADMIN_PASSWORD;

    if (!envPassword) {
      console.error("ADMIN_PASSWORD не задан в переменных окружения!");
      return NextResponse.json(
        { authenticated: false, error: "Ошибка конфигурации сервера" },
        { status: 500 }
      );
    }

    const isAuthenticated = adminAuth?.value === envPassword;

    return NextResponse.json({
      authenticated: isAuthenticated,
    });
  } catch (error) {
    console.error("Admin status check error:", error);
    return NextResponse.json(
      { authenticated: false, error: "Ошибка сервера" },
      { status: 500 }
    );
  }
} 