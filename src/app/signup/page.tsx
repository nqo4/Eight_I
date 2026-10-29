import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata: Metadata = {
  title: "회원가입 · CodeBack",
};

export default function SignupPage() {
  return (
    <AuthShell
      step="00"
      eyebrow="GET STARTED"
      title={
        <>
          AI가 만든 코드를,
          <br />
          <span className="text-brand-purple">진짜 내 코드로.</span>
        </>
      }
      description="계정을 만들고 내 GitHub 저장소의 기능에서 출발해 코드를 이해해 보세요."
    >
      <AuthForm mode="signup" />
    </AuthShell>
  );
}
