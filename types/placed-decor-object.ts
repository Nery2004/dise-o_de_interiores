import type {
  ObjectAnchor,
  PerspectiveMode,
  PerspectivePoints,
  PlacementSurfaceType,
  ZOrderMode,
} from "@/types/perspective";

export type PlacedDecorObject = {
  id: string;
  decorObjectId: string;
  name: string;
  assetUrl: string;
  assetType: "png" | "webp";
  originalWidth: number;
  originalHeight: number;
  x: number;
  y: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  selected: boolean;
  zIndex: number;
  flipX: boolean;
  flipY: boolean;
  lockAspectRatio: boolean;
  surfaceType: PlacementSurfaceType;
  anchor: ObjectAnchor;
  depth: number;
  perspectiveMode: PerspectiveMode;
  perspectivePoints?: PerspectivePoints;
  surfaceId?: string;
  autoScaleByDepth: boolean;
  baseContactOffset: number;
  zOrderMode: ZOrderMode;
  createdAt: string;
  updatedAt: string;
};

export type ObjectInteractionMode =
  | "idle"
  | "placing"
  | "moving"
  | "resizing"
  | "rotating"
  | "perspective"
  | "surface"
  | "horizon";
export type ObjectResizeHandle =
  "north-west" | "north-east" | "south-east" | "south-west";
