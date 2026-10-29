import { NextResponse, type NextRequest } from "next/server";

// FR-10: 로그인해야 쓰는 서비스다. 세션 쿠키가 없으면 학습 화면 대신 로그인 화면으로 보낸다.
// 쿠키가 있어도 만료·위조일 수 있으니, 실제 확인은 각 API의 requireUser가 한다(여기는 화면 이동만 막음).
export function proxy(request: NextRequest) {
  if (request.cookies.has("codeback_session")) return NextResponse.next();
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/demo/:path*", "/learn/:path*", "/records"],
};
