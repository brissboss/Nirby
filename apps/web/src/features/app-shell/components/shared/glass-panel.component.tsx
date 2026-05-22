import { cn } from "@/lib/utils";

const glassPanelVariants = {
  sidebar:
    "rounded-[2rem] border border-white/45 bg-background/88 shadow-2xl shadow-black/20 backdrop-blur-2xl dark:border-white/10 dark:bg-background/82",
  mobileSheet:
    "rounded-t-[1.75rem] border border-b-0 border-white/55 bg-background/95 shadow-[0_-8px_32px_rgba(0,0,0,0.14)] backdrop-blur-2xl dark:border-white/10",
  mobileTopBar:
    "rounded-3xl border border-white/60 bg-background/90 shadow-2xl shadow-black/15 backdrop-blur-2xl dark:border-white/10",
} as const;

export function GlassPanel({
  variant,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  variant: keyof typeof glassPanelVariants;
}) {
  return <div className={cn(glassPanelVariants[variant], className)} {...props} />;
}
