import { PageIntro } from "@/components/demo/PageIntro";
import { HintToggle, MissionChecklist } from "@/components/demo/Mission";

function CompareBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex h-[78px] w-[190px] shrink-0 flex-col items-start gap-[5px] rounded-8 bg-surface pt-[14px] pl-[18px]">
      <p className="text-[8px] leading-[12px] text-text-muted">{label}</p>
      <p className="text-[15px] leading-[22px] font-bold text-text-primary">{value}</p>
    </div>
  );
}

export default function MissionPage() {
  return (
    <>
      <PageIntro
        eyebrow="YOUR TURN"
        title="이제, 당신이 직접 바꿔볼 차례예요."
        description="AI가 대신 수정하지 않아요. 힌트를 따라 내 개발 환경에서 직접 시도해 보세요."
      />

      <div className="flex w-full items-start gap-[18px]">
        <section className="flex h-[600px] w-[660px] shrink-0 flex-col items-start gap-[18px] rounded-12 border border-line bg-surface px-[30px] py-[28px]">
          <div className="flex h-[24px] w-[600px] items-start justify-between">
            <p className="font-manrope text-[9px] leading-[14px] font-bold whitespace-nowrap text-brand-purple">작은 수정 미션</p>
            <span className="rounded-12 bg-brand-purple-soft px-[10px] py-[6px] text-[9px] leading-[14px] font-bold whitespace-nowrap text-brand-purple">
              난이도 · 쉬움
            </span>
          </div>

          <h2 className="w-[600px] text-[24px] leading-[36px] font-bold text-text-primary">
            같은 상품은 최대 5개까지만
            <br />
            담을 수 있게 바꿔 보세요.
          </h2>

          <div className="flex h-[54px] w-[600px] shrink-0 items-center gap-[10px] rounded-8 bg-brand-purple-soft pl-[16px] whitespace-nowrap">
            <p className="text-[8px] leading-[12px] text-text-muted">수정 예상 위치</p>
            <p className="font-mono text-[9px] leading-[15px] text-brand-purple">components/CartButton.tsx · 24</p>
          </div>

          <div className="flex h-[120px] w-[600px] shrink-0 items-center gap-[16px] whitespace-nowrap">
            <CompareBox label="현재 코드" value="if (count < 10)" />
            <span className="font-manrope text-[16px] leading-[20px] font-bold text-brand-purple">→</span>
            <CompareBox label="목표" value="최대 5개까지만" />
          </div>

          <HintToggle />
        </section>

        <MissionChecklist />
      </div>
    </>
  );
}
