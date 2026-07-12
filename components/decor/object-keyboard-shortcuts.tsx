"use client";

import { useEffect } from "react";
import { useDecorPlacement } from "@/components/decor-placement-context";
import { useEditor } from "@/components/editor-context";
import { clampObjectToImage } from "@/lib/decor/objectPlacementGeometry";

function isTypingTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable);
}

export function ObjectKeyboardShortcuts() {
  const editor = useEditor();
  const placement = useDecorPlacement();
  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      const modifier = event.metaKey || event.ctrlKey;
      if (modifier && event.key.toLowerCase() === "z" && (event.shiftKey ? placement.canRedo : placement.canUndo)) {
        event.preventDefault(); event.stopImmediatePropagation();
        if (event.shiftKey) placement.redo(); else placement.undo();
        return;
      }
      if (modifier && event.key.toLowerCase() === "y" && placement.canRedo) {
        event.preventDefault(); event.stopImmediatePropagation(); placement.redo(); return;
      }
      if (event.key === "Escape" && placement.pendingDecorObject) {
        event.preventDefault(); placement.cancelPendingObject(); return;
      }
      if (isTypingTarget(event.target) || (editor.activeTool !== "objects" && editor.activeTool !== "select")) return;
      const selected = placement.placedObjects.find((object) => object.id === placement.selectedObjectId);
      if ((event.key === "Delete" || event.key === "Backspace") && selected) {
        event.preventDefault(); placement.deletePlacedObject(selected.id); return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "d" && selected) {
        event.preventDefault(); placement.duplicatePlacedObject(selected.id); return;
      }
      if (!selected || selected.locked || !editor.dimensions || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
      event.preventDefault();
      const amount = event.shiftKey ? 10 : 1;
      const next = clampObjectToImage({ ...selected, x: selected.x + (event.key === "ArrowLeft" ? -amount : event.key === "ArrowRight" ? amount : 0), y: selected.y + (event.key === "ArrowUp" ? -amount : event.key === "ArrowDown" ? amount : 0) }, editor.dimensions);
      placement.updatePlacedObject(selected.id, next);
    }
    window.addEventListener("keydown", keydown, { capture: true });
    return () => window.removeEventListener("keydown", keydown, { capture: true });
  }, [editor.activeTool, editor.dimensions, placement]);
  return null;
}
