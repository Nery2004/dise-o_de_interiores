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
  | "paint-wall"
  | "eraser"
  | "zoom"
  | "pan"
  | "compare";

export type EditorStatus = "idle" | "loading" | "ready" | "error";

export type ImageDimensions = {
  width: number;
  height: number;
};

export type LoadedImage = {
  name: string;
  size: number;
  type: string;
  format: string;
  url: string;
  dimensions: ImageDimensions;
};

export type EditorState = {
  image: LoadedImage | null;
  zoom: number;
  activeTool: EditorTool;
  originalFile: File | null;
  temporaryUrl: string | null;
  dimensions: ImageDimensions | null;
  status: EditorStatus;
};
