import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--ink)] text-white shadow-[0_12px_30px_rgba(22,29,27,0.18)] hover:-translate-y-0.5 hover:bg-black",
        accent:
          "bg-[var(--accent)] text-[var(--ink)] shadow-[0_12px_30px_rgba(244,133,61,0.24)] hover:-translate-y-0.5 hover:bg-[#ff9b58]",
        outline:
          "border border-black/15 bg-white/70 text-[var(--ink)] hover:border-black/30 hover:bg-white",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant }), className)} {...props} />;
}
