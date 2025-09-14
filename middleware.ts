import { NextResponse } from 'next/server';

export function middleware(req: any) {
  // 管理者ルートのチェック（サインインページは除外）
  if (req.nextUrl.pathname === "/admin") {
    // /adminにアクセスした場合のみ管理者サインインページにリダイレクト
    return NextResponse.redirect(new URL("/admin/signin", req.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin"]
};
