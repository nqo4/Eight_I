import { NextResponse, type NextRequest } from "next/server";

// FR-10: 로그인해야 쓰는 서비스다. 세션 쿠키가 없으면 학습 화면 대신 로그인 화면으로 보낸다.
// 쿠키가 있어도 만료·위조일 수 있으니, 실제 확인은 각 API의 requireUser가 한다(여기는 화면 이동만 막음).
export function proxy(request: NextRequest) {
  if (request.cookies.has("codeback_session")) return NextResponse.next();
  // '샘플로 체험하기' 중이면 학습 화면만 열어 준다(볼 수 있는 데이터는 샘플뿐이고, 실제 분석 API는 여전히 로그인을 확인한다).
  if (request.cookies.has("codeback_demo") && !request.nextUrl.pathname.startsWith("/records")) return NextResponse.next();
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/demo/:path*", "/learn/:path*", "/mypage"],
};
