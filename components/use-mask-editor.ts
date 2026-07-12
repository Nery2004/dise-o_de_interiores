"use client";

import { useCallback, useEffect } from "react";
import { useEditor } from "@/components/editor-context";
import { clampPointToImage, insertPointBetween } from "@/lib/geometry/maskGeometry";
import { isTypingTarget } from "@/lib/editor/keyboardShortcuts";

export function useMaskEditor() {
  const editor = useEditor();
  const selectedMask = editor.masks.find((mask) => mask.id === editor.selectedMaskId);

  const addPoint = useCallback(() => {
    if (!selectedMask?.points || selectedMask.points.length < 2) return;
    const startIndex = editor.selectedPointIndexes.length === 1
      ? editor.selectedPointIndexes[0]
      : selectedMask.points.reduce((longestIndex, point, index, points) => {
          const next = points[(index + 1) % points.length];
          const longestNext = points[(longestIndex + 1) % points.length];
          return Math.hypot(next.x - point.x, next.y - point.y) >
            Math.hypot(longestNext.x - points[longestIndex].x, longestNext.y - points[longestIndex].y)
            ? index
            : longestIndex;
        }, 0);
    const start = selectedMask.points[startIndex];
    const end = selectedMask.points[(startIndex + 1) % selectedMask.points.length];
    const next = insertPointBetween(selectedMask.points, startIndex, {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2,
    });
    editor.updateMaskPoints(selectedMask.id, next);
    editor.setSelectedPointIndexes([startIndex + 1]);
  }, [editor, selectedMask]);

  const nudgeSelectedPoints = useCallback((dx: number, dy: number) => {
    if (!selectedMask?.points || !editor.dimensions || editor.selectedPointIndexes.length === 0) return;
    editor.updateMaskPoints(selectedMask.id, selectedMask.points.map((point, index) =>
      editor.selectedPointIndexes.includes(index)
        ? clampPointToImage({ x: point.x + dx, y: point.y + dy }, editor.dimensions!)
        : point));
  }, [editor, selectedMask]);

  useEffect(() => {
    if (editor.activeTool !== "edit-mask") return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || isTypingTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "Escape") {
        event.preventDefault();
        editor.cancelMaskEditing();
      } else if (event.key === "Enter") {
        event.preventDefault();
        editor.saveMaskEditing();
      } else if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        editor.deleteSelectedPoints();
      } else if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
        event.preventDefault();
        const distance = event.shiftKey ? 10 : 1;
        nudgeSelectedPoints(
          event.key === "ArrowLeft" ? -distance : event.key === "ArrowRight" ? distance : 0,
          event.key === "ArrowUp" ? -distance : event.key === "ArrowDown" ? distance : 0,
        );
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editor, nudgeSelectedPoints]);

  return { addPoint, selectedMask };
}
