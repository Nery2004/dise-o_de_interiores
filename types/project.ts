import type { BlendMode, WallMask } from "@/types/editor";
import type { DesignProposal } from "@/types/proposal";
import type { PlacedDecorObject } from "@/types/placed-decor-object";
import type { PerspectiveGuide, PlacementSurface } from "@/types/perspective";
import type { RoomLightProfile } from "@/types/lighting";

export const CURRENT_PROJECT_VERSION = 6;

export type ProjectImage = {
  name: string;
  type: string;
  width: number;
  height: number;
  size: number;
  dataUrl?: string;
};

export type InteriorProject = {
  id: string;
  name: string;
  description?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
  originalImage: ProjectImage;
  originalImageBlob?: Blob;
  masks: WallMask[];
  placedObjects: PlacedDecorObject[];
  placementSurfaces: PlacementSurface[];
  perspectiveGuide: PerspectiveGuide | null;
  roomLightProfiles: RoomLightProfile[];
  activeRoomLightProfileId?: string;
  activeColor: string | null;
  selectedMaskId: string | null;
  globalBlendMode: BlendMode;
  editorSettings: {
    zoom: number;
    beforeAfterEnabled: boolean;
    maskPreviewEnabled: boolean;
    brushSize: number;
    brushHardness: number;
    brushOpacity: number;
  };
  proposals: DesignProposal[];
};

export type ProjectChanges = Partial<Omit<InteriorProject, "id" | "createdAt">>;

export interface ProjectRepository {
  list(): Promise<InteriorProject[]>;
  getById(id: string): Promise<InteriorProject | undefined>;
  create(project: InteriorProject): Promise<InteriorProject>;
  update(id: string, changes: ProjectChanges): Promise<InteriorProject>;
  delete(id: string): Promise<void>;
}
