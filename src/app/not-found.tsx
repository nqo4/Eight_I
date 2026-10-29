import { Brand } from "@/components/Brand";
import { PrimaryButton } from "@/components/PrimaryButton";

// 없는 주소를 열었을 때(404). Next 기본 영어 화면 대신 서비스와 같은 모양의 한국어 안내를 보여 준다.
export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full flex-col items-start bg-paper">
      <header className="flex h-16 w-full shrink-0 items-center border-b border-line bg-surface px-4 sm:h-[76px] sm:px-9">
        <Brand />
      </header>
      <main className="flex w-full flex-1 flex-col items-start gap-4 px-5 pt-16 pb-16 sm:px-10 xl:px-[72px] xl:pt-24">
        <span className="font-manrope text-sm font-bold text-brand-purple-ink">404</span>
        <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">찾는 화면이 없어요.</h1>
        <p className="text-base text-pretty text-text-muted">주소가 바뀌었거나 잘못 입력된 것 같아요. 홈에서 다시 시작해 주세요.</p>
        <PrimaryButton href="/" label="홈으로 가기" />
      </main>
    </div>
  );
}
