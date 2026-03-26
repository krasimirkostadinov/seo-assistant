import { ChatShell } from "@features/seo-chat";
import { BrandHeader } from "@shared/BrandHeader.tsx";

export function HomePage() {
  return (
    <main className="mx-auto max-w-3xl space-y-5 px-4 py-8 md:py-10">
      <header className="relative overflow-hidden rounded-2xl border border-sf-border bg-sf-surface px-5 py-6 shadow-lg shadow-stone-900/8 ring-1 ring-sf-border-subtle backdrop-blur-sm md:px-7 md:py-7">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-linear-to-r from-sf-primary/90 via-sf-primary/40 to-sf-teal/50" />
        <BrandHeader description="Share a page URL and target keywords, then iterate on suggestions." />
      </header>
      <ChatShell />
    </main>
  );
}
