import Link from "next/link";

type FeatureCardProps = {
  number: string;
  title: string;
  description: string;
  files: string[];
  href: string;
};

// Figma: CB / Feature Card — 코드 근거가 있는 기능을 선택하는 카드.
export function FeatureCard({ number, title, description, files, href }: FeatureCardProps) {
  return (
    <Link
      href={href}
      className="flex h-[216px] min-w-px flex-1 flex-col items-start gap-[10px] rounded-12 border border-line bg-surface px-[22px] pt-[20px] pb-[18px] transition-colors hover:border-brand-purple"
    >
      <div className="flex h-[36px] w-[434px] items-center gap-[12px]">
        <div className="flex size-[36px] items-center justify-center rounded-8 bg-brand-purple-soft">
          <span className="font-manrope text-[14px] leading-[18px] font-extrabold text-brand-purple">✦</span>
        </div>
        <span className="font-mono text-[9px] leading-[14px] text-text-muted">{number}</span>
      </div>
      <p className="text-[15px] leading-[22px] font-bold whitespace-nowrap text-text-primary">{title}</p>
      <p className="h-[34px] w-[434px] text-[10px] leading-[17px] text-text-muted">{description}</p>
      <div className="flex items-start gap-[6px]">
        {files.map((file) => (
          <span key={file} className="rounded-8 bg-brand-purple-soft px-[8px] py-[5px] font-mono text-[8px] leading-[12px] text-brand-purple">
            {file}
          </span>
        ))}
      </div>
      <div className="h-px w-[434px] bg-line" />
      <div className="flex h-[18px] w-[434px] items-center justify-between text-[8px] leading-[12px] whitespace-nowrap">
        <span className="font-medium text-status-green">● 근거 3개 확인</span>
        <span className="font-bold text-brand-purple">이 기능 배우기 →</span>
      </div>
    </Link>
  );
}
