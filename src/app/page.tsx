import Link from "next/link";
import { Brand } from "@/components/Brand";
import { RepoForm } from "@/components/landing/RepoForm";
import { cartButtonCode } from "@/lib/demo";

export default function Home() {
  return (
    <div className="flex w-full flex-col items-start bg-paper">
      <header className="flex h-[76px] w-full shrink-0 items-center justify-between border-b border-line bg-surface px-[36px]">
        <Brand />
        <div className="flex items-start gap-[16px] font-bold whitespace-pre">
          <span className="font-manrope text-[10px] leading-[16px] text-status-green">{`●  INTERACTIVE PROTOTYPE`}</span>
          <Link href="/demo/overview" className="text-[11px] leading-[18px] text-brand-purple hover:underline">
            {`데모 둘러보기  →`}
          </Link>
          <Link href="/login" className="text-[11px] leading-[18px] text-text-primary hover:underline">
            로그인
          </Link>
        </div>
      </header>

      <section className="flex h-[810px] w-full shrink-0 items-start gap-[54px] px-[72px] pt-[95px]">
        <div className="flex h-[640px] w-[620px] shrink-0 flex-col items-start gap-[20px]">
          <div className="flex items-start gap-[10px]">
            <span className="rounded-12 bg-brand-purple px-[10px] py-[6px] text-[9px] leading-[14px] font-bold whitespace-nowrap text-surface">
              01
            </span>
            <span className="font-manrope text-[11px] leading-[16px] font-bold whitespace-nowrap text-brand-purple">
              FROM FEATURE TO CODE
            </span>
          </div>

          <h1 className="h-[165px] w-[609px] font-manrope text-[72px] leading-[82px] font-extrabold tracking-[-2.16px] text-text-primary">
            AI가 만든 코드를,
            <br />
            <span className="text-brand-purple">진짜 내 코드로.</span>
          </h1>

          <div className="h-[8px] w-[410px] shrink-0 bg-brand-purple" />

          <p className="w-[600px] text-[15px] leading-[27px] text-text-muted">
            완성된 기능에서 출발해 실제 파일과 코드를 따라가고,
            <br />
            개념을 이해한 뒤 작은 수정까지 직접 해보세요.
          </p>

          <RepoForm />
        </div>

        <div className="mt-[40px] flex h-[560px] w-[570px] shrink-0 flex-col items-start gap-[14px] rounded-16 bg-text-primary p-[24px]">
          <div className="flex h-[34px] w-[522px] items-start justify-between whitespace-nowrap">
            <span className="font-mono text-[10px] leading-[16px] text-surface">CartButton.tsx</span>
            <span className="text-[9px] leading-[14px] font-bold text-status-green">● 확인된 코드</span>
          </div>
          <pre className="w-[520px] font-mono text-[12px] leading-[30px] text-surface">{cartButtonCode.join("\n")}</pre>
          <Link
            href="/demo/concept"
            className="flex h-[60px] w-[522px] shrink-0 items-center justify-between rounded-8 bg-brand-purple px-[16px] font-bold whitespace-nowrap"
          >
            <span className="text-[9px] leading-[14px] text-brand-purple-soft">핵심 개념</span>
            <span className="text-[12px] leading-[18px] text-surface">상태 업데이트 + 조건문</span>
            <span className="font-manrope text-[16px] leading-[20px] text-accent-lime">→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
