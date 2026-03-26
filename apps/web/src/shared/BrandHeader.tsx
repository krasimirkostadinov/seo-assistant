export function BrandHeader({ description }: { description?: string }) {
  return (
    <>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sf-primary">
        Your SEO workspace
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-sf-text md:text-[2rem]">
        Your custom SEO agent
      </h1>
      {description && (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-sf-muted">
          {description}
        </p>
      )}
    </>
  );
}
