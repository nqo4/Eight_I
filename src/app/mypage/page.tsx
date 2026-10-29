import type { Metadata } from "next";
import { MyPage } from "@/components/mypage/MyPage";

export const metadata: Metadata = {
  title: "내 학습 기록 · CodeBack",
};

export default function MyPageRoute() {
  return <MyPage />;
}
