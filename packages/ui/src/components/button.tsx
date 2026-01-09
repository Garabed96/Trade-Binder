import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 active:scale-95",
  {
    variants: {
      color: {
        primary: "",
        secondary: "",
        destructive: "",
        warning: "",
      },
      variant: {
        solid: "",
        ghost: "",
        outline: "",
      },
      size: {
        default: "px-4 py-2 text-sm",
        sm: "px-3 py-1.5 text-xs",
        lg: "px-6 py-3 text-base",
        icon: "h-10 w-10",
        "icon-sm": "p-1.5",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    compoundVariants: [
      // Primary + Solid
      {
        color: "primary",
        variant: "solid",
        className: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20 hover:brightness-110",
      },
      // Primary + Ghost
      {
        color: "primary",
        variant: "ghost",
        className: "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50",
      },
      // Primary + Outline
      {
        color: "primary",
        variant: "outline",
        className: "border border-blue-500 bg-transparent text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50",
      },
      // Secondary + Solid
      {
        color: "secondary",
        variant: "solid",
        className: "bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600",
      },
      // Secondary + Ghost
      {
        color: "secondary",
        variant: "ghost",
        className: "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
      },
      // Secondary + Outline
      {
        color: "secondary",
        variant: "outline",
        className: "border border-slate-300 bg-transparent text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800",
      },
      // Destructive + Solid
      {
        color: "destructive",
        variant: "solid",
        className: "bg-red-600 text-white shadow-lg shadow-red-600/20 hover:bg-red-700",
      },
      // Destructive + Ghost
      {
        color: "destructive",
        variant: "ghost",
        className: "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50",
      },
      // Destructive + Outline
      {
        color: "destructive",
        variant: "outline",
        className: "border border-red-500 bg-transparent text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50",
      },
      // Warning + Solid
      {
        color: "warning",
        variant: "solid",
        className: "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20 hover:brightness-110",
      },
      // Warning + Ghost
      {
        color: "warning",
        variant: "ghost",
        className: "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50",
      },
      // Warning + Outline
      {
        color: "warning",
        variant: "outline",
        className: "border border-amber-500 bg-transparent text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/50",
      },
    ],
    defaultVariants: {
      color: "primary",
      variant: "solid",
      size: "default",
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color">,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, color, variant, size, fullWidth, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(buttonVariants({ color, variant, size, fullWidth, className }))}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {children}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
