import { PrimaryButton } from "@/components/PrimaryButton";
import { PageIntro } from "@/components/demo/PageIntro";
import { FlowSteps } from "@/components/demo/FlowSteps";
import { cartButtonCode } from "@/lib/demo";

export default function FlowPage() {
  return (
    <>
      <PageIntro
        grouped
        eyebrow="HOW IT WORKS"
        title="장바구니 담기, 코드는 이렇게 움직여요"
        description="화면의 클릭이 실제 코드에서 어떤 길을 따라가는지 확인해 보세요."
      />

      <FlowSteps />

      <div className="flex w-full items-start overflow-clip rounded-12 border border-line bg-surface">
        <div className="flex h-[450px] w-[690px] shrink-0 flex-col items-start gap-[12px] bg-text-primary px-[26px] py-[22px] font-mono">
          <p className="text-[9px] leading-[14px] whitespace-pre text-text-muted">{`components/CartButton.tsx        main · a8c91f2`}</p>
          <pre className="w-[630px] font-mono text-[12px] leading-[31px] text-surface">{cartButtonCode.join("\n")}</pre>
        </div>
        <div className="flex h-[450px] w-[390px] shrink-0 flex-col items-start gap-[16px] bg-surface p-[28px]">
          <p className="font-manrope text-[9px] leading-[14px] font-bold whitespace-nowrap text-brand-purple">지금 보는 코드</p>
          <p className="w-[330px] text-[20px] leading-[30px] font-bold text-text-primary">클릭하면 함수가 실행돼요</p>
          <p className="w-[330px] text-[11px] leading-[20px] text-text-muted">
            onClick은 버튼에서 “클릭이 일어났어”라고 알려주는 연결 고리예요. 이때 addToCart 함수가 실행됩니다.
          </p>
          <PrimaryButton href="/demo/concept" label="이 코드의 개념 배우기" />
        </div>
      </div>
    </>
  );
}
