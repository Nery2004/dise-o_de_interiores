import type { EditorInteractionState, EditorTool } from "@/types/editor";
import type { ObjectInteractionMode } from "@/types/placed-decor-object";
import type { ComparisonMode } from "@/types/proposal";

const objectStates: Partial<
  Record<ObjectInteractionMode, EditorInteractionState>
> = {
  placing: "placing-object",
  moving: "moving-object",
  resizing: "resizing-object",
  rotating: "rotating-object",
  perspective: "editing-perspective",
  marquee: "marquee-selecting",
  surface: "editing-perspective",
  horizon: "editing-perspective",
};

export function resolveEditorInteractionState({
  activeTool,
  comparisonMode,
  isDrawingMask,
  objectInteractionMode,
}: {
  activeTool: EditorTool;
  comparisonMode: ComparisonMode;
  isDrawingMask: boolean;
  objectInteractionMode: ObjectInteractionMode;
}): EditorInteractionState {
  const objectState = objectStates[objectInteractionMode];
  if (objectState) return objectState;
  if (isDrawingMask) return "drawing-mask";
  if (
    activeTool === "compare" &&
    ["slider", "split-horizontal", "split-vertical"].includes(comparisonMode)
  )
    return "comparing";
  if (activeTool === "pan") return "panning";
  if (activeTool === "zoom") return "zooming";
  if (activeTool === "manual-select") return "selecting-mask";
  if (activeTool === "edit-mask") return "editing-mask-point";
  if (activeTool === "add-to-mask" || activeTool === "remove-from-mask")
    return "refining-mask";
  if (activeTool === "define-surface" || activeTool === "horizon")
    return "editing-perspective";
  return "idle";
}
