export function ShellOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-shell overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-background/30 via-transparent to-background/45 md:bg-linear-to-r md:from-background/35 md:via-transparent md:to-transparent" />
      {children}
    </div>
  );
}
