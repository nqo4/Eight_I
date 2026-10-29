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
      <h1 className="text-[22px] leading-8 font-bold sm:text-[28px] sm:leading-10 text-balance text-text-primary">{title}</h1>
      <p className="text-sm leading-6 text-pretty text-text-muted sm:text-base sm:leading-7">{description}</p>
    </div>
  );
}
