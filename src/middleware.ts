import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Middleware runs in Edge Runtime, so we cannot import Prisma here.
// Auth checks for protected routes are done at the page/API level instead.
// This middleware only handles basic route matching if needed.

export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"],
};
