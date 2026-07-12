import type { WallMask } from "@/types/editor";
import type { PlacedDecorObject } from "@/types/placed-decor-object";
import type { PerspectiveGuide, PlacementSurface } from "@/types/perspective";
import type { RoomLightProfile } from "@/types/lighting";

export type DesignProposal = {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
  masksSnapshot: WallMask[];
  placedObjectsSnapshot: PlacedDecorObject[];
  placementSurfacesSnapshot: PlacementSurface[];
  perspectiveGuideSnapshot: PerspectiveGuide | null;
  roomLightProfileSnapshot?: RoomLightProfile;
  activeColor?: string | null;
  tags?: string[];
  isFavorite?: boolean;
};

export type ComparisonMode =
  | "original"
  | "edited"
  | "slider"
  | "side-by-side"
  | "proposals"
  | "split-vertical"
  | "split-horizontal";
