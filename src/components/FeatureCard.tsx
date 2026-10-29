type FeatureCardProps = {
  number: string;
  title: string;
  description: string;
  files: string[];
  evidenceCount: number;
  selected?: boolean;
  onSelect?: () => void;
};

// FR-04 '기능' 목록의 한 항목. 누르면 기능 상세(FR-15)로 간다.
// Figma: CB / Feature Card — 코드 근거가 있는 기능을 선택하는 카드.
export function FeatureCard({ number, title, description, files, evidenceCount, selected = false, onSelect }: FeatureCardProps) {
  const className = `flex min-w-0 flex-col items-start gap-2.5 rounded-12 border bg-surface px-[22px] pt-5 pb-[18px] text-left transition-colors hover:border-brand-purple focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-purple ${
    selected ? "border-brand-purple ring-1 ring-brand-purple" : "border-line"
  }`;
  const body = (
    <>
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-8 bg-brand-purple-soft">
          <span aria-hidden className="font-manrope text-sm font-extrabold text-brand-purple">✦</span>
        </div>
        <span className="font-mono text-xs text-text-muted">{number}</span>
      </div>
      <p className="text-lg font-bold text-text-primary">{title}</p>
      <p className="text-sm leading-6 text-text-muted">{description}</p>
      <div className="flex flex-wrap items-start gap-1.5">
        {files.map((file) => (
          <span key={file} className="rounded-8 bg-brand-purple-soft px-2 py-1 font-mono text-xs break-all text-brand-purple-ink">
            {file}
          </span>
        ))}
      </div>
      <div className="h-px w-full bg-line" />
      <div className="flex w-full items-center justify-between text-xs">
        <span className="font-medium text-status-green-ink">● 근거 {evidenceCount}개 확인</span>
        <span className="font-bold text-brand-purple-ink">{selected ? "선택됨" : "이 기능 고르기 →"}</span>
      </div>
    </>
  );
  return (
    <button type="button" data-testid="feature-card" aria-pressed={selected} onClick={onSelect} className={className}>
      {body}
    </button>
  );
}
