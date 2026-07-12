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
  createdAt: string;
  updatedAt: string;
};

export type ObjectInteractionMode = "idle" | "placing" | "moving" | "resizing" | "rotating";
export type ObjectResizeHandle = "north-west" | "north-east" | "south-east" | "south-west";
