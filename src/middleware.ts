import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Защищаем админ панель
  if (request.nextUrl.pathname.startsWith("/admin")) {
    // Разрешаем доступ к странице логина
    if (request.nextUrl.pathname === "/admin/login") {
      return NextResponse.next();
    }

    const adminPassword = request.cookies.get("admin-auth")?.value;
    const envPassword = process.env.ADMIN_PASSWORD || "admin123";
    
    if (adminPassword !== envPassword) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/admin"],
}; 