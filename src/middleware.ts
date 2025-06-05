import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Защищаем админ панель
  if (pathname.startsWith("/admin")) {
    // Разрешаем доступ к странице логина
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }

    const adminPassword = request.cookies.get("admin-auth")?.value;
    const envPassword = process.env.ADMIN_PASSWORD || "admin123";
    
    if (!adminPassword || adminPassword !== envPassword) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/admin"],
}; 