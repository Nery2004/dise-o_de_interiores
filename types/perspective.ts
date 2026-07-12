import type { ImagePoint } from "@/types/editor";

export type PlacementSurfaceType =
  "floor" | "wall" | "table" | "ceiling" | "free";
export type ObjectAnchor = "center" | "bottom-center" | "top-center";
export type PerspectiveMode = "none" | "surface" | "free-transform";
export type ZOrderMode = "manual" | "depth";

export type PerspectivePoints = {
  topLeft: ImagePoint;
  topRight: ImagePoint;
  bottomRight: ImagePoint;
  bottomLeft: ImagePoint;
};

export type PlacementSurface = {
  id: string;
  name: string;
  type: PlacementSurfaceType;
  points: ImagePoint[];
  visible: boolean;
  locked: boolean;
  selected: boolean;
  detected: boolean;
  snapEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PerspectiveGuide = {
  horizonY: number;
  vanishingPoint1?: ImagePoint;
  vanishingPoint2?: ImagePoint;
  visible: boolean;
};
