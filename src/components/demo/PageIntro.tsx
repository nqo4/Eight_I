type PageIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
  // 개요·코드 흐름 화면은 제목 묶음 간격이 6px, 나머지 화면은 본문 간격(22px)을 그대로 사용
  grouped?: boolean;
};

export function PageIntro({ eyebrow, title, description, grouped = false }: PageIntroProps) {
  const textWidth = grouped ? "w-[980px]" : "w-[1000px]";
  const content = (
    <>
      <p className="font-manrope text-[10px] leading-[16px] font-bold whitespace-nowrap text-brand-purple">{eyebrow}</p>
      <h1 className={`${textWidth} text-[28px] leading-[40px] font-bold text-text-primary`}>{title}</h1>
      <p className={`${textWidth} text-[12px] leading-[20px] text-text-muted`}>{description}</p>
    </>
  );

  return grouped ? <div className="flex flex-col items-start gap-[6px]">{content}</div> : content;
}
