export function SectionHeading({ eyebrow, title, description, centered = false }: { eyebrow: string; title: string; description?: string; centered?: boolean }) {
  return <div className={`landing-reveal max-w-2xl ${centered ? "mx-auto text-center" : ""}`}><p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--sage-dark)]">{eyebrow}</p><h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.03em] text-[var(--graphite)] sm:text-4xl">{title}</h2>{description ? <p className="mt-4 text-base leading-7 text-[var(--muted)]">{description}</p> : null}</div>;
}
