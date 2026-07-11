import type { BlendMode, WallMask } from "@/types/editor";

export const CURRENT_PROJECT_VERSION = 1;

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
};

export type ProjectChanges = Partial<Omit<InteriorProject, "id" | "createdAt">>;

export interface ProjectRepository {
  list(): Promise<InteriorProject[]>;
  getById(id: string): Promise<InteriorProject | undefined>;
  create(project: InteriorProject): Promise<InteriorProject>;
  update(id: string, changes: ProjectChanges): Promise<InteriorProject>;
  delete(id: string): Promise<void>;
}
