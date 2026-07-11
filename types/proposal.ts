import type { WallMask } from "@/types/editor";

export type DesignProposal = {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
  masksSnapshot: WallMask[];
  activeColor?: string | null;
  tags?: string[];
  isFavorite?: boolean;
};

export type ComparisonMode = "original" | "edited" | "slider" | "side-by-side" | "proposals" | "split-vertical" | "split-horizontal";
