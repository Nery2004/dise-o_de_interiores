"use client";

import { useEffect } from "react";
import { useDecorPlacement } from "@/components/decor-placement-context";
import { useEditor } from "@/components/editor-context";
import { clampObjectToImage } from "@/lib/decor/objectPlacementGeometry";
import {
  getHistoryShortcut,
  hasPrimaryModifier,
  isTypingTarget,
} from "@/lib/editor/keyboardShortcuts";

export function ObjectKeyboardShortcuts() {
  const editor = useEditor();
  const placement = useDecorPlacement();
  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      if (event.defaultPrevented || isTypingTarget(event.target)) return;
      const modifier = hasPrimaryModifier(event);
      const historyShortcut = getHistoryShortcut(event);
      if (historyShortcut === "undo" && placement.canUndo) {
        event.preventDefault(); event.stopImmediatePropagation();
        placement.undo();
        return;
      }
      if (historyShortcut === "redo" && placement.canRedo) {
        event.preventDefault(); event.stopImmediatePropagation(); placement.redo(); return;
      }
      if (event.key === "Escape" && placement.pendingDecorObject) {
        event.preventDefault(); placement.cancelPendingObject(); return;
      }
      if (editor.activeTool !== "objects" && editor.activeTool !== "select") return;
      const selected = placement.placedObjects.find((object) => object.id === placement.selectedObjectId);
      if ((event.key === "Delete" || event.key === "Backspace") && selected) {
        event.preventDefault(); placement.deleteSelectedObjects(); return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "d" && selected) {
        event.preventDefault(); placement.duplicateSelectedObjects(); return;
      }
      if (modifier && event.key.toLowerCase() === "g" && selected) {
        event.preventDefault();
        if (event.shiftKey) placement.ungroupSelectedObjects(); else placement.groupSelectedObjects();
        return;
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
