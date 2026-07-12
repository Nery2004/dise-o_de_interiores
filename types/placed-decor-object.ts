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
  lightingMode: "auto" | "manual" | "none";
  lightingLocked?: boolean;
  brightness: number;
  contrast: number;
  saturation: number;
  temperature: number;
  tint: number;
  exposure: number;
  highlights: number;
  shadows: number;
  sharpness: number;
  depthBlur: number;
  adaptDepthBlur: boolean;
  adaptTexture: boolean;
  grain: number;
  shadowSettings?: {
    enabled: boolean;
    type: "contact" | "projected" | "both";
    opacity: number;
    blur: number;
    softness: number;
    offsetX: number;
    offsetY: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
    color: string;
    contactOpacity: number;
    contactBlur: number;
    contactWidth: number;
    contactHeight: number;
    autoDirection: boolean;
  };
  lightProfileId?: string;
  groupId?: string;
  tags: string[];
  relativeScale: "small" | "medium" | "large";
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
  | "marquee"
  | "surface"
  | "horizon";
export type ObjectResizeHandle =
  "north-west" | "north-east" | "south-east" | "south-west";
