import type { Metadata } from "next";
import { MyPage } from "@/components/mypage/MyPage";

export const metadata: Metadata = {
  title: "마이페이지 · CodeBack",
};

export default function MyPageRoute() {
  return <MyPage />;
}
