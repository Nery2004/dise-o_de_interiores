type FeatureCardProps = {
  kicker: string;
  title: string;
  description: string;
};

export function FeatureCard({ kicker, title, description }: FeatureCardProps) {
  return (
    <article className="rounded-lg border border-[#ded6c9] bg-[#fbfaf7]/76 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7a735f]">
        {kicker}
      </p>
      <h2 className="mt-4 text-xl font-semibold text-[#242a25]">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-[#687169]">{description}</p>
    </article>
  );
}
