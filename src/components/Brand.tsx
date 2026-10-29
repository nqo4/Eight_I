import Link from "next/link";

// Figma: CB / Brand — CodeBack 로고와 워드마크. 헤더에서 사용.
export function Brand() {
  return (
    <Link href="/" className="flex shrink-0 items-start gap-[10px]">
      <span className="font-mono text-[15px] leading-[20px] whitespace-nowrap text-text-primary">
        {"</>"}
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/figma/brand-dot.svg" alt="" width={9} height={9} className="block shrink-0" />
      <span className="font-manrope text-[20px] leading-[26px] font-extrabold whitespace-nowrap text-text-primary">
        CodeBack
      </span>
    </Link>
  );
}
