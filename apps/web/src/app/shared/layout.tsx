import Link from "next/link";

import { Logo } from "@/components/logo";
import { LanguageSelector } from "@/components/ui/language-selector";
import { MAIN_CONTENT_ID } from "@/lib/a11y/landmarks";

export default function SharedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2 text-foreground">
            <Logo className="h-8 w-8" />
            <span className="font-display text-xl font-bold">Nirby</span>
          </Link>
          <LanguageSelector />
        </div>
      </header>
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="mx-auto max-w-2xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
