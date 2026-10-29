import { Brand } from "@/components/Brand";

export function DemoHeader() {
  return (
    <header className="flex h-[76px] w-full shrink-0 items-center justify-between border-b border-line bg-surface px-[36px]">
      <Brand />
      <div className="flex items-start gap-[16px] font-bold whitespace-pre">
        <span className="text-[11px] leading-[18px] text-text-primary">{`현재 프로젝트  ·  codeback-demo-shop`}</span>
        <span className="text-[10px] leading-[16px] text-status-green">{`●  데모 모드`}</span>
      </div>
    </header>
  );
}
