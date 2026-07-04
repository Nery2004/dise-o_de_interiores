import type { ReactNode } from "react";

type EditorPanelProps = {
  title: string;
  eyebrow: string;
  children: ReactNode;
};

export function EditorPanel({ title, eyebrow, children }: EditorPanelProps) {
  return (
    <section className="rounded-lg border border-[#ded6c9] bg-white/70 p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7a735f]">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-base font-semibold text-[#242a25]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
