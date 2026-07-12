import type { WallMask } from "@/types/editor";
import type { PlacedDecorObject } from "@/types/placed-decor-object";

export type DesignProposal = {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
  masksSnapshot: WallMask[];
  placedObjectsSnapshot: PlacedDecorObject[];
  activeColor?: string | null;
  tags?: string[];
  isFavorite?: boolean;
};

export type ComparisonMode = "original" | "edited" | "slider" | "side-by-side" | "proposals" | "split-vertical" | "split-horizontal";
