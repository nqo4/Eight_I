type PageIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
  grouped?: boolean;
};

export function PageIntro({ eyebrow, title, description }: PageIntroProps) {
  return (
    <div className="flex max-w-[1000px] flex-col items-start gap-1.5">
      <p className="font-manrope text-xs font-bold tracking-wider text-brand-purple-ink">{eyebrow}</p>
      <h1 className="text-[28px] leading-10 font-bold text-balance text-text-primary">{title}</h1>
      <p className="text-base leading-7 text-pretty text-text-muted">{description}</p>
    </div>
  );
}
