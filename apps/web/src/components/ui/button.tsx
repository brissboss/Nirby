import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border border-border/50 bg-card/80 shadow-sm hover:bg-muted/70 hover:text-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-muted/70 hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        panel:
          "h-auto w-full justify-start gap-3 border border-border/50 bg-card/80 px-4 py-3.5 text-sm font-medium shadow-sm hover:bg-muted/70",
        "panel-destructive":
          "h-auto w-full justify-start gap-3 border border-border/50 bg-card/80 px-4 py-3.5 text-sm font-medium shadow-sm text-destructive hover:bg-destructive hover:text-destructive-foreground",
      },
      size: {
        default: "h-12 lg:h-9 text-lg lg:text-sm px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-3 text-sm has-[>svg]:px-2.5",
        lg: "h-10 px-6 has-[>svg]:px-4",
        icon: "size-10",
        "icon-sm": "size-8",
        "icon-lg": "size-11",
      },
    },
    compoundVariants: [
      {
        variant: ["panel", "panel-destructive"],
        class: "h-auto",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(
        buttonVariants({ variant, size, className }),
        loading && "opacity-50 cursor-not-allowed"
      )}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </Comp>
  );
}

export { Button, buttonVariants };
