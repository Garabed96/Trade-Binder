import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const inputVariants = cva(
  "w-full transition-all focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "h-10 px-4 rounded-2xl border border-slate-300 bg-transparent text-sm font-bold text-slate-900 placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-400 dark:focus:border-amber-400/50 dark:focus:ring-amber-400/50",
        danger:
          "h-10 px-4 rounded-2xl border border-red-500 bg-transparent text-sm font-bold text-slate-900 placeholder-slate-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/50 dark:text-slate-100 dark:placeholder-slate-400",
      },
      size: {
        default: "",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input, inputVariants };
