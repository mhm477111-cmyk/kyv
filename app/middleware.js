import { NextResponse } from 'next/server';

export function middleware(request) {
  // بنشوف لو فيه كوكي الدخول بتاع فايربيس
  const session = request.cookies.get('__session');

  // لو المستخدم موجود في الصفحة الرئيسية ومعاه الكوكي (يعني مسجل دخول)
  if (request.nextUrl.pathname === '/' && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/'],
};
