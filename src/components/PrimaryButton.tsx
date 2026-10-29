import Link from "next/link";
import type { ComponentProps } from "react";

type PrimaryButtonProps = {
  label: string;
  tone?: "purple" | "ink";
} & (
  | ({ href: string } & Omit<ComponentProps<typeof Link>, "href" | "children">)
  | ({ href?: undefined } & Omit<ComponentProps<"button">, "children">)
);

// Figma: CB / Button / Primary — CodeBack 주요 진행 버튼.
export function PrimaryButton({ label, tone = "purple", className = "", ...rest }: PrimaryButtonProps) {
  const classes = `inline-flex shrink-0 items-center justify-center gap-[10px] rounded-8 px-[22px] py-[14px] leading-[18px] whitespace-nowrap transition-opacity hover:opacity-90 ${
    tone === "ink" ? "bg-ink" : "bg-brand-purple"
  } ${className}`;

  const content = (
    <>
      <span className="text-[12px] font-bold text-surface">{label}</span>
      <span
        className={`font-manrope text-[14px] font-extrabold ${tone === "ink" ? "text-surface" : "text-accent-lime"}`}
      >
        →
      </span>
    </>
  );

  if (rest.href !== undefined) {
    return (
      <Link {...(rest as ComponentProps<typeof Link>)} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" {...(rest as ComponentProps<"button">)} className={classes}>
      {content}
    </button>
  );
}
