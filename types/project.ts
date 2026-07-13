import type { BlendMode, WallMask } from "@/types/editor";
import type { DesignProposal } from "@/types/proposal";
import type { PlacedDecorObject } from "@/types/placed-decor-object";
import type { PerspectiveGuide, PlacementSurface } from "@/types/perspective";
import type { RoomLightProfile } from "@/types/lighting";
import type { ObjectGroup } from "@/types/object-group";
import type { DecorObjectFolder } from "@/types/decor-object";

export const PROJECT_SCHEMA_VERSION = 7;
export const LATEST_PROJECT_VERSION = PROJECT_SCHEMA_VERSION;
export const CURRENT_PROJECT_VERSION = LATEST_PROJECT_VERSION;

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
  objectGroups: ObjectGroup[];
  objectFolders: DecorObjectFolder[];
  favoriteObjectIds: string[];
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
