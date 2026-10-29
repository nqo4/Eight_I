import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata: Metadata = {
  title: "로그인 · CodeBack",
};

export default function LoginPage() {
  return (
    <AuthShell
      step="01"
      eyebrow="WELCOME BACK"
      title={
        <>
          멈췄던 곳에서,
          <br />
          <span className="text-brand-purple">다시 내 코드로.</span>
        </>
      }
      description="로그인하고 분석한 저장소와 학습 진행 상황을 이어서 확인하세요."
    >
      <AuthForm mode="login" />
    </AuthShell>
  );
}
