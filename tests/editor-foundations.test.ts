import assert from "node:assert/strict";
import test from "node:test";
import { resolveEditorInteractionState } from "@/lib/editor/interactionState";
import { getHistoryShortcut } from "@/lib/editor/keyboardShortcuts";

test("los atajos de historial reconocen macOS, Windows y redo alternativo", () => {
  assert.equal(
    getHistoryShortcut({ key: "z", metaKey: true, ctrlKey: false, shiftKey: false }),
    "undo",
  );
  assert.equal(
    getHistoryShortcut({ key: "Z", metaKey: false, ctrlKey: true, shiftKey: true }),
    "redo",
  );
  assert.equal(
    getHistoryShortcut({ key: "y", metaKey: false, ctrlKey: true, shiftKey: false }),
    "redo",
  );
  assert.equal(
    getHistoryShortcut({ key: "z", metaKey: false, ctrlKey: false, shiftKey: false }),
    null,
  );
});

test("el estado de interacción prioriza arrastres activos sobre la herramienta", () => {
  const base = {
    activeTool: "select" as const,
    comparisonMode: "edited" as const,
    isDrawingMask: false,
    objectInteractionMode: "idle" as const,
  };
  assert.equal(resolveEditorInteractionState(base), "idle");
  assert.equal(
    resolveEditorInteractionState({ ...base, activeTool: "pan" }),
    "panning",
  );
  assert.equal(
    resolveEditorInteractionState({
      ...base,
      activeTool: "pan",
      objectInteractionMode: "resizing",
    }),
    "resizing-object",
  );
  assert.equal(
    resolveEditorInteractionState({
      ...base,
      activeTool: "compare",
      comparisonMode: "slider",
    }),
    "comparing",
  );
});
