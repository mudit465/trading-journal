import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-zinc-700 bg-zinc-800 text-zinc-300",
        win: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
        loss: "border-red-500/20 bg-red-500/10 text-red-400",
        breakeven: "border-zinc-600 bg-zinc-800 text-zinc-400",
        indigo: "border-indigo-500/20 bg-indigo-500/10 text-indigo-400",
        outline: "border-zinc-700 bg-transparent text-zinc-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
