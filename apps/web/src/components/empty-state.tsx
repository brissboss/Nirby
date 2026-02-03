import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
};

export function EmptyState({ icon, title, description, children, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center h-full text-center px-4 text-muted-foreground gap-8",
        className
      )}
    >
      {!children && (
        <>
          {icon}
          <div className="flex flex-col items-center justify-center max-w-xs w-full gap-1">
            {title && <h2 className="text-2xl font-bold truncate">{title}</h2>}
            {description && <p className="text-sm break-all">{description}</p>}
          </div>
        </>
      )}
      {children}
    </div>
  );
}
