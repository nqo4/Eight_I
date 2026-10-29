import { FeatureCard } from "@/components/FeatureCard";
import { PageIntro } from "@/components/demo/PageIntro";
import { features } from "@/lib/demo";

export default function OverviewPage() {
  return (
    <>
      <PageIntro
        grouped
        eyebrow="PROJECT OVERVIEW"
        title="먼저, 이 프로젝트를 한눈에 볼까요?"
        description="코드 전체가 아니라 내가 아는 기능에서 시작하면 훨씬 쉬워요."
      />

      <div className="flex w-full items-start gap-[20px] rounded-12 bg-brand-purple-soft px-[24px] py-[20px]">
        <span className="text-[26px] leading-[34px] whitespace-nowrap">🛒</span>
        <div className="flex flex-col items-start gap-[4px] text-text-primary">
          <p className="text-[17px] whitespace-nowrap leading-[24px] font-bold">CodeBack Demo Shop</p>
          <p className="text-[10px] leading-[16px] whitespace-nowrap">상품을 둘러보고 장바구니에 담을 수 있는 작은 쇼핑 웹앱이에요.</p>
        </div>
      </div>

      <div className="flex w-full items-start justify-between">
        <h2 className="text-[18px] leading-[26px] font-bold whitespace-nowrap text-text-primary">어떤 기능부터 알아볼까요?</h2>
        <span className="rounded-12 bg-brand-purple-soft px-[10px] py-[6px] text-[9px] leading-[14px] font-bold whitespace-nowrap text-brand-purple">
          {features.length}개 기능 발견
        </span>
      </div>

      <div className="grid w-full grid-cols-2 gap-[12px]">
        {features.map((feature) => (
          <FeatureCard key={feature.number} {...feature} href="/demo/flow" />
        ))}
      </div>
    </>
  );
}
