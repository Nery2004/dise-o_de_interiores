export type WallColorSwatch = {
  name: string;
  hex: `#${string}`;
};

export type EditorStage = {
  id: "upload" | "selection" | "render";
  label: string;
  status: "Ready" | "Next";
  description: string;
};

export type MoodBoard = {
  name: string;
  description: string;
  colors: Array<`#${string}`>;
};

export type EditorTool =
  | "select"
  | "objects"
  | "define-surface"
  | "horizon"
  | "manual-select"
  | "edit-mask"
  | "add-to-mask"
  | "remove-from-mask"
  | "paint-wall"
  | "eraser"
  | "zoom"
  | "pan"
  | "compare";

export type EditorStatus =
  "idle" | "loading" | "ready" | "detecting" | "exporting" | "error";

export type BlendMode =
  | "paint-simulation"
  | "normal"
  | "multiply"
  | "color"
  | "overlay"
  | "soft-light"
  | "hard-light";

export type PaintMode = "direct" | "white-base";

export type RenderQuality = "draft" | "high" | "ultra";

export type WallColorProfile =
  | "warm-light"
  | "warm-dark"
  | "cool-light"
  | "cool-dark"
  | "neutral-light"
  | "neutral-dark"
  | "saturated"
  | "unknown";

export type WhiteBaseSettings = {
  mode: "auto" | "manual";
  analysisVersion: number;
  analysisKey?: string;
  analyzedAt?: string;
  profile?: WallColorProfile;
  averageColor?: string;
  medianColor?: string;
  averageLuminance?: number;
  averageSaturation?: number;
  dominantHue?: number;
  darkPixelRatio?: number;
  lightPixelRatio?: number;
  neutralizationStrength: number;
  saturationReduction: number;
  warmthCorrection: number;
  baseBrightness: number;
  baseContrast: number;
  shadowPreservation: number;
  texturePreservation: number;
};

export type ImageDimensions = {
  width: number;
  height: number;
};

export type ImagePoint = {
  x: number;
  y: number;
};

export type BrushStroke = {
  id: string;
  mode: "add" | "remove";
  size: number;
  hardness: number;
  opacity: number;
  points: ImagePoint[];
  createdAt: string;
};

export type MaskRefinement = {
  width: number;
  height: number;
  addStrokes: BrushStroke[];
  removeStrokes: BrushStroke[];
};

export type LoadedImage = {
  name: string;
  size: number;
  type: string;
  format: string;
  url: string;
  dimensions: ImageDimensions;
};

export type WallMask = {
  id: string;
  name: string;
  type: "auto" | "manual";
  confidence?: number;
  qualityScore?: number;
  visible: boolean;
  selected: boolean;
  color?: string;
  opacity: number;
  blendMode?: BlendMode;
  paintMode?: PaintMode;
  primerCoverage?: number;
  paintIntensity?: number;
  edgeFeather?: number;
  renderQuality?: RenderQuality;
  whiteBaseSettings?: WhiteBaseSettings;
  path?: string;
  points?: ImagePoint[];
  originalPoints?: ImagePoint[];
  refinement?: MaskRefinement;
  createdAt: string;
  updatedAt?: string;
};

export type EditorState = {
  image: LoadedImage | null;
  zoom: number;
  activeTool: EditorTool;
  originalFile: File | null;
  temporaryUrl: string | null;
  dimensions: ImageDimensions | null;
  status: EditorStatus;
  masks: WallMask[];
  selectedMaskId: string | null;
  activeColor: string | null;
  maskPreviewEnabled: boolean;
  beforeAfterEnabled: boolean;
  globalBlendMode: BlendMode;
  isDrawingMask: boolean;
  manualPoints: ImagePoint[];
  cursorPreviewPoint: ImagePoint | null;
  selectedPointIndexes: number[];
  editingMaskId: string | null;
  editingStartPoints: ImagePoint[] | null;
  editingHistoryStart: number;
  moveWholeMask: boolean;
  undoStack: WallMask[][];
  redoStack: WallMask[][];
  brushSize: number;
  brushHardness: number;
  brushOpacity: number;
  maskOnlyPreview: boolean;
  invertRefinementPreview: boolean;
  whiteBasePreviewMaskId: string | null;
};
