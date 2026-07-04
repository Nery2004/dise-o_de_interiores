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
