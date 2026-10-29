import { PrimaryButton } from "@/components/PrimaryButton";
import { PageIntro } from "@/components/demo/PageIntro";

const concepts = [
  { badge: "✓", title: "상태 (State)", caption: "화면이 값을 기억하는 방법", active: true },
  { badge: "2", title: "이벤트 처리", caption: "클릭에 반응하는 방법", active: false },
  { badge: "3", title: "조건문", caption: "10개까지만 담는 방법", active: false },
];

function StateBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex h-[78px] w-[190px] shrink-0 flex-col items-start gap-[5px] rounded-8 bg-surface pt-[14px] pl-[18px]">
      <p className="text-[8px] leading-[12px] whitespace-nowrap text-text-muted">{label}</p>
      <p className="text-[15px] leading-[22px] font-bold whitespace-pre text-text-primary">{value}</p>
    </div>
  );
}

export default function ConceptPage() {
  return (
    <>
      <PageIntro
        eyebrow="LEARN FROM YOUR CODE"
        title="내 서비스에서 왜 ‘상태’가 필요할까요?"
        description="문법보다 먼저, 이 코드가 내 서비스에서 하는 일을 이해해 봐요."
      />

      <div className="flex w-full items-start gap-[18px]">
        <section className="flex h-[610px] w-[730px] shrink-0 flex-col items-start gap-[18px] rounded-12 border border-line bg-surface px-[30px] py-[28px]">
          <p className="font-manrope text-[9px] leading-[14px] font-bold whitespace-nowrap text-brand-purple">CONCEPT 01</p>
          <h2 className="w-[660px] text-[23px] leading-[34px] font-bold text-text-primary">상태는 화면이 기억하는 값이에요</h2>
          <p className="w-[660px] text-[12px] leading-[22px] text-text-muted">
            장바구니 수량은 버튼을 누를 때마다 달라집니다. React는 이 값을 state(상태)에 기억하고, 값이 달라지면 화면을 다시 보여줘요.
          </p>

          <div className="flex h-[120px] w-[660px] items-center gap-[16px] rounded-12 bg-brand-purple-soft px-[20px]">
            <StateBox label="클릭 전" value={`장바구니  0`} />
            <p className="text-[9px] leading-[14px] font-bold whitespace-pre text-brand-purple">{`버튼 클릭  →`}</p>
            <StateBox label="클릭 후" value={`장바구니  1`} />
          </div>

          <p className="text-[12px] leading-[18px] font-bold whitespace-nowrap text-text-primary">내 코드에서는 여기예요</p>
          <div className="flex h-[116px] w-[660px] flex-col items-start gap-[14px] rounded-8 bg-text-primary px-[22px] pt-[18px] whitespace-pre">
            <code className="font-mono text-[13px] leading-[24px] text-surface">{`21   const [count, setCount] = useState(0)`}</code>
            <p className="text-[8px] leading-[14px] font-medium text-brand-purple-soft">{`현재 값        값을 바꾸는 함수          처음 값`}</p>
          </div>
        </section>

        <aside className="flex h-[610px] w-[330px] shrink-0 flex-col items-start gap-[12px] rounded-12 border border-line bg-surface px-[22px] py-[24px]">
          {concepts.map((concept) => (
            <div
              key={concept.title}
              className={`flex h-[68px] w-[286px] shrink-0 items-center gap-[12px] rounded-8 border pl-[12px] ${
                concept.active ? "border-brand-purple bg-brand-purple-soft" : "border-line bg-surface"
              }`}
            >
              <span
                className={`rounded-12 px-[10px] py-[6px] text-[9px] leading-[14px] font-bold whitespace-nowrap ${
                  concept.active ? "bg-brand-purple text-surface" : "bg-brand-purple-soft text-brand-purple"
                }`}
              >
                {concept.badge}
              </span>
              <div className="flex flex-col items-start gap-[2px] whitespace-nowrap">
                <p className="text-[10px] leading-[15px] font-bold text-text-primary">{concept.title}</p>
                <p className="text-[8px] leading-[12px] text-text-muted">{concept.caption}</p>
              </div>
            </div>
          ))}
          <PrimaryButton href="/demo/quiz" label="이해했어요, 확인해 볼게요" />
        </aside>
      </div>
    </>
  );
}
