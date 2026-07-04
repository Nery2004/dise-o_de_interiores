import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StudioFrameProps = {
  children: ReactNode;
  className?: string;
};

export function StudioFrame({ children, className }: StudioFrameProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-[#ddd5c7] bg-[#ebe4d7] shadow-[0_24px_80px_rgba(46,42,35,0.16)]",
        "aspect-[4/3] sm:aspect-[16/11] lg:aspect-[5/4]",
        className,
      )}
    >
      {children}
    </div>
  );
}
